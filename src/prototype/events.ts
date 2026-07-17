export type EventRecord = {
  id: string;
  eventTime: string;
  ingestedAt: string;
  category: string;
  source: string;
  host: string;
  user: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  masked: boolean;
};

export const prototypeEvents: EventRecord[] = [
  { id: 'evt-94af2', eventTime: '2026-07-18T09:42:13+08:00', ingestedAt: '2026-07-18T09:42:19+08:00', category: 'authentication', source: 'identity-gateway', host: 'vpn-gw-02', user: 'a.chen', action: 'login_failed', severity: 'high', message: 'Repeated authentication failures followed by a successful login.', masked: false },
  { id: 'evt-94af3', eventTime: '2026-07-18T09:43:01+08:00', ingestedAt: '2026-07-18T09:43:07+08:00', category: 'network', source: 'edge-firewall', host: 'workstation-044', user: '—', action: 'connection_allowed', severity: 'medium', message: 'Outbound connection to a newly observed destination.', masked: false },
  { id: 'evt-94af4', eventTime: '2026-07-18T09:44:22+08:00', ingestedAt: '2026-07-18T09:44:53+08:00', category: 'process', source: 'endpoint-agent', host: 'finance-lt-17', user: 'masked', action: 'process_started', severity: 'critical', message: 'Sensitive process details hidden by field-level policy.', masked: true },
  { id: 'evt-94af5', eventTime: '2026-07-18T09:46:02+08:00', ingestedAt: '2026-07-18T09:46:08+08:00', category: 'dns', source: 'resolver', host: 'workstation-044', user: 'a.chen', action: 'query', severity: 'low', message: 'DNS query observed for a newly registered domain.', masked: false }
];

export const isPrototypeMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_FIXTURES === 'true';

export async function searchPrototypeEvents(term: string): Promise<EventRecord[]> {
  if (!isPrototypeMode) throw new Error('Prototype fixture adapter is disabled outside explicit development mode.');
  const query = term.trim().toLowerCase();
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (!query) return prototypeEvents;
  return prototypeEvents.filter((event) => Object.values(event).some((value) => String(value).toLowerCase().includes(query)));
}
