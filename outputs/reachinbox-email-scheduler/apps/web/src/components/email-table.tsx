import { AlertCircle, CheckCircle2, Clock3, Inbox, LoaderCircle } from 'lucide-react';
import type { EmailDelivery } from '../types';

function prettyDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function Status({ status }: { status: EmailDelivery['status'] }) {
  const props = status === 'SENT' ? ['bg-emerald-50 text-emerald-700', <CheckCircle2 className="h-3.5 w-3.5" />, 'Sent']
    : status === 'FAILED' ? ['bg-rose-50 text-rose-700', <AlertCircle className="h-3.5 w-3.5" />, 'Failed']
    : status === 'SENDING' ? ['bg-amber-50 text-amber-700', <LoaderCircle className="h-3.5 w-3.5 animate-spin" />, 'Sending']
    : ['bg-sky-50 text-sky-700', <Clock3 className="h-3.5 w-3.5" />, 'Scheduled'];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${props[0]}`}>{props[1]}{props[2]}</span>;
}

export function EmailTable({ emails, kind, loading, error }: { emails: EmailDelivery[]; kind: 'scheduled' | 'sent'; loading: boolean; error: string | null }) {
  if (loading) return <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white"><LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" /></div>;
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  if (!emails.length) return <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-center"><div><span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-slate-100"><Inbox className="h-5 w-5 text-slate-400" /></span><p className="font-semibold text-slate-700">No {kind} emails yet</p><p className="mt-1 text-sm text-slate-500">{kind === 'scheduled' ? 'Your next campaign will appear here.' : 'Delivered and failed emails will appear here.'}</p></div></div>;
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">{kind === 'scheduled' ? 'Scheduled time' : 'Sent time'}</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{emails.map((email) => <tr key={email.id} className="transition hover:bg-slate-50/60"><td className="px-5 py-4 font-medium text-slate-700">{email.recipient}</td><td className="max-w-[270px] truncate px-5 py-4 text-slate-600">{email.subject}</td><td className="px-5 py-4 text-slate-500">{prettyDate(kind === 'scheduled' ? email.scheduledFor : email.sentAt ?? email.failedAt)}</td><td className="px-5 py-4"><Status status={email.status} /><span className="sr-only">{email.failureReason}</span></td></tr>)}</tbody></table></div></div>;
}
