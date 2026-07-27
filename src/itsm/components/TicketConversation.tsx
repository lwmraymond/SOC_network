import { useEffect, useMemo, useState } from 'react';
import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiPanel, EuiSpacer, EuiTextArea, EuiTitle } from '@elastic/eui';
import type { CommentCreateInput, TicketAttachment, TicketBundle } from '../contracts';
import { itsmApi } from '../client';
import { useItsmMutation } from '../hooks';
import { createDemoMutationContext } from './demoContext';
import { ItsmTabs } from './ItsmTabs';

const mentionPattern = /@([\w-]+)/g;

export function extractMentions(body: string): string[] {
  return Array.from(new Set(Array.from(body.matchAll(mentionPattern)).map((match) => match[1])));
}

export function TicketConversation({ bundle, onRehydrated }: { bundle: TicketBundle; onRehydrated: (bundle: TicketBundle) => void }) {
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public');
  const [body, setBody] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<TicketAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string>();
  const input = useMemo<CommentCreateInput>(() => ({
    body: body.trim(),
    visibility,
    mentions: extractMentions(body),
    attachmentIds: pendingAttachments.map((attachment) => attachment.id),
  }), [body, pendingAttachments, visibility]);

  const mutation = useItsmMutation<CommentCreateInput, TicketBundle>({
    preview: (comment, signal) => itsmApi.previewCreateComment(bundle.ticket.id, comment, signal),
    execute: async (comment, signal) => {
      const result = await itsmApi.createComment(bundle.ticket.id, comment, createDemoMutationContext(bundle.ticket.etag, bundle.ticket.version), signal);
      return { receipt: result.receipt };
    },
    rehydrate: (_comment, receipt, signal) => itsmApi.refreshTicket(bundle.ticket.id, receipt.receiptId, signal),
  });

  useEffect(() => {
    if (mutation.state.stage !== 'complete' || !mutation.state.authoritative) return;
    onRehydrated(mutation.state.authoritative);
    setBody('');
    setPendingAttachments([]);
  }, [mutation.state.authoritative, mutation.state.stage, onRehydrated]);

  const addAttachment = async () => {
    setAttachmentError(undefined);
    try {
      const result = await itsmApi.createAttachmentPlaceholder(bundle.ticket.id, `evidence-placeholder-${pendingAttachments.length + 1}.txt`, createDemoMutationContext(bundle.ticket.etag, bundle.ticket.version));
      if (result.resource) setPendingAttachments((current) => [...current, result.resource as TicketAttachment]);
    } catch (error: unknown) {
      setAttachmentError(error instanceof Error ? error.message : String(error));
    }
  };

  return <div className="itsmConversationLayout">
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Conversation</h2></EuiTitle><EuiSpacer size="s" />
      <div className="itsmThread">{bundle.comments.length === 0 ? <EuiCallOut title="No conversation yet">Public replies and internal notes will appear in one auditable thread.</EuiCallOut> : bundle.comments.map((comment) => <article key={comment.id} className={`itsmComment ${comment.visibility}`} data-comment-visibility={comment.visibility}>
        <div><strong>{comment.authorDisplayName}</strong><EuiBadge color={comment.visibility === 'internal' ? 'warning' : 'hollow'}>{comment.visibility === 'internal' ? 'Internal note' : 'Public reply'}</EuiBadge><EuiBadge color="hollow">{comment.source}</EuiBadge></div>
        <p>{comment.body}</p>
        {comment.mentions.length > 0 && <small>Mentions: {comment.mentions.map((mention) => `@${mention}`).join(', ')}</small>}
        <small>{comment.createdAt} · event {comment.id}{comment.sourceMessageId ? ` · sourceMessageId ${comment.sourceMessageId}` : ''}</small>
      </article>)}</div>
    </EuiPanel>

    <EuiPanel paddingSize="m" hasBorder className="itsmComposer">
      <ItsmTabs items={['Public reply', 'Internal note']} active={visibility === 'public' ? 'Public reply' : 'Internal note'} onChange={(value) => setVisibility(value === 'Public reply' ? 'public' : 'internal')} />
      <EuiSpacer size="s" />
      <EuiFormRow label={visibility === 'public' ? 'Reply visible to requester' : 'Internal note visible to permitted agents'} helpText="Use @mention syntax. Mentions remain contract-only until identity resolution is connected.">
        <EuiTextArea value={body} onChange={(event) => setBody(event.target.value)} rows={7} placeholder={visibility === 'public' ? 'Write a requester-visible update…' : 'Write an internal operational note…'} />
      </EuiFormRow>
      {pendingAttachments.length > 0 && <><EuiCallOut title="Attachment placeholders" color="warning">{pendingAttachments.map((attachment) => attachment.filename).join(', ')}. No bytes were uploaded; uploadState remains placeholder.</EuiCallOut><EuiSpacer size="s" /></>}
      {attachmentError && <><EuiCallOut title="Attachment placeholder failed" color="danger">{attachmentError}</EuiCallOut><EuiSpacer size="s" /></>}
      <EuiFlexGroup gutterSize="s" wrap>
        <EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => void addAttachment()}>Add attachment placeholder</EuiButtonEmpty></EuiFlexItem>
        <EuiFlexItem />
        <EuiFlexItem grow={false}><EuiButton fill onClick={() => void mutation.requestPreview(input)} isDisabled={!input.body}>Preview before send</EuiButton></EuiFlexItem>
      </EuiFlexGroup>
      {mutation.state.stage !== 'idle' && <>
        <EuiSpacer />
        <EuiCallOut title={mutation.state.preview ? mutation.state.preview.summary : mutation.state.stage === 'complete' ? 'Ephemeral refresh completed' : 'Governed write in progress'} color={mutation.state.error ? 'danger' : 'warning'}>
          {mutation.state.error?.message ?? (mutation.state.stage === 'complete' ? 'The development fixture store was re-read. authoritative:false; the browser-memory comment is visible for review only.' : mutation.state.receipt ? `${mutation.state.receipt.receiptId} · ${mutation.state.receipt.state}; not completed.` : 'Previewing permissions, validation and affected resources.')}
        </EuiCallOut>
        <EuiSpacer size="s" />
        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
          <EuiFlexItem grow={false}><EuiButtonEmpty onClick={mutation.reset}>Reset</EuiButtonEmpty></EuiFlexItem>
          {mutation.state.stage === 'preview' && <EuiFlexItem grow={false}><EuiButton fill onClick={() => void mutation.confirm()}>Confirm queued send</EuiButton></EuiFlexItem>}
        </EuiFlexGroup>
      </>}
    </EuiPanel>
  </div>;
}
