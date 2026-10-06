import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import type { Priority, TaskStatus } from '@/types';

export const STATUS_CLASS: Record<TaskStatus, string> = {
  todo: 'border-border bg-transparent text-muted-foreground',
  in_progress: 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300',
  blocked: 'border-transparent bg-amber-500/20 text-amber-800 dark:text-amber-300',
  done: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const { t } = useI18n();
  return <Badge className={cn(STATUS_CLASS[status], className)}>{t(`status.${status}`)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useI18n();
  if (priority !== 'high') return null;
  return <Badge className="border-transparent bg-red-500/15 text-red-700 dark:text-red-300">{t('priority.high')}</Badge>;
}
