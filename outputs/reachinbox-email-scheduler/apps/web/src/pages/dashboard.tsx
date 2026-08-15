import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, RefreshCw, Send, TimerReset } from 'lucide-react';
import { api } from '../api';
import { ComposeModal } from '../components/compose-modal';
import { EmailTable } from '../components/email-table';
import { Shell } from '../components/shell';
import type { EmailDelivery, User } from '../types';

type Tab = 'scheduled' | 'sent';
type DataState = { emails: EmailDelivery[]; loading: boolean; error: string | null };

export function Dashboard({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [tab, setTab] = useState<Tab>('scheduled');
  const [composeOpen, setComposeOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [state, setState] = useState<Record<Tab, DataState>>({
    scheduled: { emails: [], loading: true, error: null }, sent: { emails: [], loading: true, error: null }
  });

  const load = useCallback(async (kind: Tab) => {
    setState((current) => ({ ...current, [kind]: { ...current[kind], loading: true, error: null } }));
    try {
      const received = await api.emails(kind);
      setState((current) => ({ ...current, [kind]: { emails: received.emails, loading: false, error: null } }));
    } catch (error) {
      setState((current) => ({ ...current, [kind]: { ...current[kind], loading: false, error: error instanceof Error ? error.message : 'Could not load emails.' } }));
    }
  }, []);

  useEffect(() => { void load('scheduled'); void load('sent'); }, [load]);
  useEffect(() => { if (notice) { const timer = window.setTimeout(() => setNotice(null), 4500); return () => window.clearTimeout(timer); } }, [notice]);

  const current = state[tab];
  const title = tab === 'scheduled' ? 'Scheduled emails' : 'Sent emails';
  const subtitle = tab === 'scheduled' ? 'Your queued delivery timeline, in order.' : 'A record of successful and failed SMTP handoffs.';

  return <Shell user={user} tab={tab} onTabChange={setTab} onCompose={() => setComposeOpen(true)} onLogout={() => void onLogout()}>
    <section className="mx-auto max-w-6xl px-4 py-7 sm:px-7 lg:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LIVE DELIVERY QUEUE</div><h1 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><button onClick={() => void load(tab)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"><RefreshCw className={`h-4 w-4 ${current.loading ? 'animate-spin' : ''}`} /> Refresh</button></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><Metric icon={<TimerReset className="h-4 w-4" />} label="Scheduled" value={state.scheduled.emails.length} tone="sky" /><Metric icon={<CheckCircle2 className="h-4 w-4" />} label="Sent" value={state.sent.emails.filter((email) => email.status === 'SENT').length} tone="emerald" /><Metric icon={<Send className="h-4 w-4" />} label="Global cap" value="Protected" tone="slate" /></div>
      <div className="mb-5 flex gap-2 border-b border-slate-200"><button onClick={() => setTab('scheduled')} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab === 'scheduled' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Scheduled <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{state.scheduled.emails.length}</span></button><button onClick={() => setTab('sent')} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab === 'sent' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Sent <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">{state.sent.emails.length}</span></button></div>
      <EmailTable emails={current.emails} kind={tab} loading={current.loading} error={current.error} />
    </section>
    {notice && <div className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-lg bg-[#16392f] px-4 py-3 text-sm font-semibold text-white shadow-xl"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{notice}</div>}
    {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} onScheduled={(count) => { setComposeOpen(false); setNotice(`${count} email${count === 1 ? '' : 's'} scheduled successfully.`); setTab('scheduled'); void load('scheduled'); }} />}
  </Shell>;
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string | number; tone: 'sky' | 'emerald' | 'slate' }) {
  const colour = tone === 'sky' ? 'bg-sky-50 text-sky-700' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600';
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><span className={`grid h-8 w-8 place-items-center rounded-lg ${colour}`}>{icon}</span><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="text-base font-bold text-slate-700">{value}</p></div></div>;
}
