import { useMemo, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldText, EuiPanel, EuiTitle } from '@elastic/eui';

loader.config({ monaco });

const examples: Record<string,string> = {
  javascript: `export async function investigate(input) {\n  const events = await input.search({ severity: 'high' });\n  return { reviewed: events.length, mutation: false };\n}`,
  json: `{"schemaVersion":1,"dataset":"security.events","fields":[{"path":"event.action","type":"keyword","required":true}]}`,
  yaml: `name: suspicious-login-review\ntrigger: alert.created\nsteps:\n  - search: related_events\n  - approval: analyst_review\n  - action: create_case_draft`,
  sql: `FROM security-events-*\n| WHERE event.category == "authentication"\n| STATS failures = COUNT(*) BY user.name`,
};

export function EditorWorkspace({ title, language = 'javascript', sideTitle = 'Validation and execution' }: { title: string; language?: 'javascript'|'json'|'yaml'|'sql'; sideTitle?: string }) {
  const initial = useMemo(() => examples[language] ?? examples.javascript, [language]);
  const [value,setValue]=useState(initial);
  const [validated,setValidated]=useState(false);
  return <div className="editorWorkspace" data-visual-region="editor"><aside className="editorLibrary"><EuiTitle size="xs"><h2>{title} library</h2></EuiTitle>{['Published baseline','Draft revision 8','Sandbox example','Rollback candidate'].map((item,index)=><button type="button" key={item}><strong>{item}</strong><small>rev {12-index}</small></button>)}</aside><EuiPanel paddingSize="none" className="monacoPanel"><div className="editorToolbar"><EuiBadge color="hollow">{language}</EuiBadge><EuiBadge color="warning">Prototype / no production run</EuiBadge><EuiButtonEmpty size="xs" onClick={()=>setValue(initial)}>Reset</EuiButtonEmpty></div><Editor height="540px" language={language === 'sql' ? 'sql' : language} value={value} onChange={(next)=>setValue(next??'')} theme="vs-dark" options={{ minimap:{enabled:false},fontSize:13,automaticLayout:true,scrollBeyondLastLine:false,readOnly:false,ariaLabel:`${title} Monaco editor` }} /></EuiPanel><EuiPanel paddingSize="m" className="editorInspector"><EuiTitle size="xs"><h2>{sideTitle}</h2></EuiTitle><label>Target scope<EuiFieldText defaultValue="sandbox / fixture targets" /></label><EuiButton onClick={()=>setValidated(true)}>Validate</EuiButton>{validated&&<EuiCallOut title="Prototype validation passed" color="success">Syntax, input schema and capability shape are valid. Production execution remains disabled.</EuiCallOut>}<div className="editorActions"><EuiButtonEmpty>Dry run</EuiButtonEmpty><EuiButton fill isDisabled>Run production</EuiButton></div></EuiPanel></div>;
}
