import type { DateStr, Task } from './types';

/** Today in the user's local calendar, as YYYY-MM-DD. */
export function today(now = new Date()): DateStr {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: DateStr, days: number): DateStr {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The date a task next needs attention: the earlier of follow-up and due. */
export function attentionDate(task: Task): DateStr | null {
  const dates = [task.followUpDate, task.dueDate].filter((d): d is DateStr => !!d);
  return dates.length ? dates.sort()[0] : null;
}

export function isOverdue(task: Task, now = today()): boolean {
  if (task.status === 'done') return false;
  const d = attentionDate(task);
  return d !== null && d < now;
}

export type Bucket = 'overdue' | 'today' | 'week' | 'later';

export function bucketOf(date: DateStr, now = today()): Bucket {
  if (date < now) return 'overdue';
  if (date === now) return 'today';
  if (date <= addDays(now, 7)) return 'week';
  return 'later';
}
