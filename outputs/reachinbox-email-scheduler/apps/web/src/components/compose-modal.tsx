import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AlertCircle, CalendarClock, FileText, LoaderCircle, Upload, X } from 'lucide-react';
import { api } from '../api';
import type { SchedulerSettings } from '../types';

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const extractAddresses = (value: string) => [...new Set(value.match(emailPattern)?.map((email) => email.toLowerCase()) ?? [])];

function localDatetimeValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ComposeModal({ onClose, onScheduled }: { onClose: () => void; onScheduled: (count: number) => void }) {
  const [settings, setSettings] = useState<SchedulerSettings | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(localDatetimeValue(new Date(Date.now() + 5 * 60_000)));
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [senderAddress, setSenderAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.settings().then((received) => {
      setSettings(received);
      setDelaySeconds(received.policy.minDelaySeconds);
      setHourlyLimit(received.policy.globalHourlyLimit);
      setSenderAddress(received.senders[0] ?? '');
    }).catch(() => setError('Could not load scheduler settings. Please close and try again.'));
  }, []);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 2_000_000) { setError('Choose a file smaller than 2 MB.'); return; }
    const text = await file.text();
    const found = extractAddresses(text);
    setRecipients(found);
    setFileName(file.name);
    if (!found.length) setError('No valid email addresses were found in that file.');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!recipients.length) return setError('Upload a CSV or text file with at least one email address.');
    if (!settings) return setError('Scheduler settings are still loading.');
    setSubmitting(true);
    try {
      const result = await api.schedule({
        recipients, subject, body, startAt: new Date(startAt).toISOString(),
        delaySeconds, hourlyLimit, senderAddress, idempotencyKey: crypto.randomUUID()
      });
      onScheduled(result.campaign.scheduledCount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not schedule this campaign.');
      setSubmitting(false);
    }
  }

  return <div className="fixed inset-0 z-30 overflow-y-auto bg-slate-900/35 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Compose new email">
    <div className="mx-auto my-2 max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-8">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="text-base font-bold text-slate-800">Compose new email</h2><p className="mt-0.5 text-xs text-slate-500">Schedule a reliable delivery sequence.</p></div><button onClick={onClose} className="icon-button" aria-label="Close compose dialog"><X className="h-5 w-5" /></button></header>
      <form onSubmit={submit} className="p-5 sm:p-6">
        {error && <div className="mb-4 flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="label" htmlFor="subject">Subject</label><input id="subject" className="field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A quick idea for your team" required /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="body">Email body</label><textarea id="body" className="field min-h-32 resize-y" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" required /></div>
          <div className="sm:col-span-2"><label className="label">Recipient list</label><input ref={inputRef} onChange={readFile} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" /><button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm"><Upload className="h-4 w-4" /></span><span><span className="block text-sm font-semibold text-slate-700">{fileName ?? 'Upload CSV or text file'}</span><span className="block text-xs text-slate-500">{recipients.length ? `${recipients.length.toLocaleString()} unique email address${recipients.length === 1 ? '' : 'es'} detected` : 'We will extract and deduplicate email addresses.'}</span></span></span>{fileName && <FileText className="h-4 w-4 text-slate-400" />}</button></div>
          <div><label className="label" htmlFor="start">Start time</label><div className="relative"><CalendarClock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="start" type="datetime-local" min={localDatetimeValue(new Date())} className="field pl-9" value={startAt} onChange={(e) => setStartAt(e.target.value)} required /></div></div>
          <div><label className="label" htmlFor="sender">Send from</label><select id="sender" className="field" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} disabled={!settings}>{settings?.senders.map((sender) => <option key={sender}>{sender}</option>)}</select></div>
          <div><label className="label" htmlFor="delay">Delay between emails (seconds)</label><input id="delay" type="number" className="field" min={settings?.policy.minDelaySeconds ?? 1} max={settings?.policy.maxDelaySeconds ?? 60} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} required /><p className="mt-1 text-[11px] text-slate-500">Provider minimum: {settings?.policy.minDelaySeconds ?? '…'} sec</p></div>
          <div><label className="label" htmlFor="limit">Campaign hourly target</label><input id="limit" type="number" className="field" min="1" max={settings?.policy.maxCampaignHourlyLimit ?? 1000} value={hourlyLimit} onChange={(e) => setHourlyLimit(Number(e.target.value))} required /><p className="mt-1 text-[11px] text-slate-500">Global cap: {settings?.policy.globalHourlyLimit ?? '…'} emails/hr</p></div>
        </div>
        <footer className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={submitting || !settings} className="inline-flex items-center gap-2 rounded-lg bg-[#147d56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f6646]">{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />} Schedule {recipients.length ? `${recipients.length} email${recipients.length === 1 ? '' : 's'}` : 'emails'}</button></footer>
      </form>
    </div>
  </div>;
}
