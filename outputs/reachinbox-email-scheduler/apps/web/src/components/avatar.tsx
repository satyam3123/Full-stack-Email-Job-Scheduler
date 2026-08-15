import type { User } from '../types';

export function Avatar({ user, size = 'md' }: { user: Pick<User, 'name' | 'avatarUrl'>; size?: 'sm' | 'md' }) {
  const dimensions = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  if (user.avatarUrl) return <img className={`${dimensions} rounded-full object-cover`} src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />;
  return <span className={`${dimensions} grid place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700`}>{user.name.slice(0, 2).toUpperCase()}</span>;
}
