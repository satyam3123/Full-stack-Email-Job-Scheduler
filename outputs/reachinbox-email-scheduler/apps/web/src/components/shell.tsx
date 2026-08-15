import { ChevronDown, ClipboardList, Inbox, LogOut, MailPlus, Send, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from './avatar';
import type { User } from '../types';

type Tab = 'scheduled' | 'sent';

export function Shell({ user, tab, onTabChange, onCompose, onLogout, children }: {
  user: User;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onCompose: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-[#f7f9f8]">
    <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-slate-200 bg-white px-3 py-5 lg:block">
      <div className="mb-8 flex items-center gap-2 px-2 text-[15px] font-bold tracking-tight text-slate-900">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[#16392f] text-sm text-white">O</span> outbox
      </div>
      <button className="mb-6 flex w-full items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">
        <span className="grid h-5 w-5 place-items-center rounded bg-emerald-100 text-[9px] font-bold text-emerald-700">O</span>
        Personal workspace <ChevronDown className="ml-auto h-3.5 w-3.5" />
      </button>
      <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Mailbox</p>
      <nav className="space-y-1">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"><Inbox className="h-4 w-4" /> Inbox</button>
        <button onClick={() => onTabChange('scheduled')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${tab === 'scheduled' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}><ClipboardList className="h-4 w-4" /> Scheduled</button>
        <button onClick={() => onTabChange('sent')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${tab === 'sent' ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}><Send className="h-4 w-4" /> Sent</button>
      </nav>
      <div className="absolute bottom-4 left-3 right-3 border-t border-slate-100 pt-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"><Settings className="h-4 w-4" /> Settings</button>
      </div>
    </aside>
    <main className="lg:ml-60">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur lg:px-8">
        <div className="flex items-center gap-3 lg:hidden"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#16392f] text-sm text-white">O</span><span className="font-bold">outbox</span></div>
        <div className="hidden text-sm font-medium text-slate-500 lg:block">Email scheduler <span className="mx-2 text-slate-300">/</span> Campaigns</div>
        <div className="flex items-center gap-2">
          <button onClick={onCompose} className="inline-flex items-center gap-2 rounded-lg bg-[#147d56] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f6646]"><MailPlus className="h-4 w-4" /> <span className="hidden sm:inline">Compose new email</span><span className="sm:hidden">Compose</span></button>
          <div className="ml-1 hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
            <Avatar user={user} size="sm" /><div className="max-w-32 text-left leading-tight"><p className="truncate text-xs font-semibold text-slate-800">{user.name}</p><p className="truncate text-[10px] text-slate-500">{user.email}</p></div>
            <button onClick={onLogout} className="icon-button" aria-label="Log out" title="Log out"><LogOut className="h-4 w-4" /></button>
          </div>
          <button onClick={onLogout} className="icon-button sm:hidden" aria-label="Log out"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>
      {children}
    </main>
  </div>;
}
