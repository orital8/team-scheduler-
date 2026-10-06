import { CalendarClockIcon, MessageSquareIcon, RefreshCwIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { isOverdue } from '@/dates';
import { MemberAvatar } from './Avatar';
import { PriorityBadge, StatusBadge } from './StatusBadge';
import { useOpenTask } from './useOpenTask';

export function TaskRow({ task, showProject = false }: { task: Task; showProject?: boolean }) {
  const { store, actor, data } = useApp();
  const { t, formatDate } = useI18n();
  const openTask = useOpenTask();
  const done = task.status === 'done';
  const overdue = isOverdue(task);
  const assignee = data.members.find((m) => m.id === task.assigneeId);
  const project = showProject ? data.projects.find((p) => p.id === task.projectId) : null;
  const comments = data.comments.filter((c) => c.taskId === task.id).length;
  const dateClass = overdue ? 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300' : '';

  return (
    <div className="group flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2 hover:bg-muted/50 sm:flex-nowrap">
      <Checkbox
        checked={done}
        aria-label={t('status.done')}
        onCheckedChange={() => store.updateTask(actor(), task.id, { status: done ? 'todo' : 'done' })}
      />
      <button className="flex min-w-0 flex-1 flex-col items-start text-start" onClick={() => openTask(task.id)}>
        <span dir="auto" className={cn('max-w-full truncate text-sm', done && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
        {project && <span className="text-xs text-muted-foreground">{project.name}</span>}
      </button>
      <div className="flex shrink-0 items-center gap-1.5 ps-7 sm:ps-0">
        {comments > 0 && (
          <Badge variant="outline" className="text-muted-foreground">
            <MessageSquareIcon /> {comments}
          </Badge>
        )}
        <PriorityBadge priority={task.priority} />
        {task.status !== 'todo' && !done && <StatusBadge status={task.status} />}
        {task.followUpDate && !done && (
          <Badge variant="outline" className={dateClass} title={t('field.followUpDate')}>
            <RefreshCwIcon /> {formatDate(task.followUpDate)}
          </Badge>
        )}
        {task.dueDate && (
          <Badge variant="outline" className={done ? '' : dateClass} title={t('field.dueDate')}>
            <CalendarClockIcon /> {formatDate(task.dueDate)}
          </Badge>
        )}
        <MemberAvatar member={assignee} />
      </div>
    </div>
  );
}
