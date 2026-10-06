import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Activity } from '@/types';
import type { StringKey } from '@/i18n/strings';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/state/AppContext';
import { MemberAvatar } from './Avatar';
import { useOpenTask } from './useOpenTask';

/** Replace {name} placeholders in a template with React nodes. */
function fill(template: string, vars: Record<string, ReactNode>) {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    return <Fragment key={i}>{m ? (vars[m[1]] ?? part) : part}</Fragment>;
  });
}

const Val = ({ children }: { children: ReactNode }) => (
  <span className="bg-muted px-1.5 py-0.5 text-xs">{children}</span>
);

export function ActivityFeed({ items, showProject = true }: { items: Activity[]; showProject?: boolean }) {
  const { t, formatDate, formatRelative, formatDateTime } = useI18n();
  const { data, memberName } = useApp();
  const openTask = useOpenTask();

  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{t('act.empty')}</p>;

  const value = (field: string | null, v: string | null): string => {
    if (v === null || v === '') return t('common.none');
    switch (field) {
      case 'status':
        return t(`status.${v}` as StringKey);
      case 'priority':
        return t(`priority.${v}` as StringKey);
      case 'assigneeId':
        return memberName(v) ?? t('common.unknown');
      case 'dueDate':
      case 'followUpDate':
        return formatDate(v);
      default:
        return v;
    }
  };

  return (
    <ul className="divide-y">
      {items.map((a) => {
        const actor = data.members.find((m) => m.id === a.actorId);
        const taskExists = a.taskId && data.tasks.some((x) => x.id === a.taskId);
        const projectExists = data.projects.some((p) => p.id === a.projectId);
        const field = a.data.field ?? null;
        const isTask = a.kind.startsWith('task');
        const key = (a.kind === 'task.updated' && field === 'description'
          ? 'act.task.updated.description'
          : `act.${a.kind}`) as StringKey;

        const vars: Record<string, ReactNode> = {
          who: <span className="font-semibold">{actor?.name ?? t('common.unknown')}</span>,
          project: projectExists ? (
            <Link className="font-medium underline-offset-4 hover:underline" to={`/project/${a.projectId}`}>
              {a.data.projectName}
            </Link>
          ) : (
            <span className="font-medium">{a.data.projectName}</span>
          ),
          task: taskExists ? (
            <button
              className="font-medium underline-offset-4 hover:underline"
              onClick={() => openTask(a.taskId!)}
              dir="auto"
            >
              {a.data.task}
            </button>
          ) : (
            <span className="font-medium">{a.data.task}</span>
          ),
          list: <span className="font-medium">{a.data.list}</span>,
          field: t(`field.${field}` as StringKey),
          from: <Val>{isTask ? value(field, a.data.from) : a.data.from}</Val>,
          to: <Val>{isTask ? value(field, a.data.to) : a.data.to}</Val>,
          count: a.data.count,
          text: a.data.text,
        };

        return (
          <li key={a.id} className="flex gap-3 py-3">
            <MemberAvatar member={actor} />
            <div className="min-w-0 flex-1 text-sm leading-6 [overflow-wrap:anywhere]">
              <div>{fill(t(key), vars)}</div>
              <div className="text-xs text-muted-foreground">
                <time dateTime={a.at} title={formatDateTime(a.at)}>
                  {formatRelative(a.at)}
                </time>
                {showProject && isTask && <span> · {a.data.projectName}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
