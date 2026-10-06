import { useState, type FormEvent, type ReactNode } from 'react';
import { SendIcon, Trash2Icon } from 'lucide-react';
import { PRIORITIES, STATUSES, type Task, type TaskPatch } from '@/types';
import { useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { addDays, isOverdue, today } from '@/dates';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MemberAvatar } from './Avatar';
import { ActivityFeed } from './ActivityFeed';
import { DatePicker } from './DatePicker';
import { useDialogs } from './dialogs';
import { useOpenTask } from './useOpenTask';

const UNASSIGNED = '__none__';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{children}</h3>;
}

export function TaskDrawer({ task }: { task: Task }) {
  const { store, actor, data, me } = useApp();
  const { t, dir, formatRelative, formatDateTime } = useI18n();
  const dialogs = useDialogs();
  const openTask = useOpenTask();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [comment, setComment] = useState('');

  const update = (patch: TaskPatch) => store.updateTask(actor(), task.id, patch);
  const lists = data.lists.filter((l) => l.projectId === task.projectId).sort((a, b) => a.order - b.order);
  const project = data.projects.find((p) => p.id === task.projectId);
  const comments = data.comments.filter((c) => c.taskId === task.id);
  const history = data.activity.filter((a) => a.taskId === task.id && a.kind !== 'task.commented');
  const creator = data.members.find((m) => m.id === task.createdBy);

  const commitTitle = () => {
    const v = title.trim();
    if (v && v !== task.title) update({ title: v });
    else setTitle(task.title);
  };

  const post = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    store.addComment(actor(), task.id, comment);
    setComment('');
  };

  const remove = async () => {
    const ok = await dialogs.confirm({
      title: t('common.delete'),
      description: t('common.confirmDelete', { name: task.title }),
    });
    if (!ok) return;
    openTask(null);
    store.deleteTask(actor(), task.id);
  };

  const followUpIn = (days: number) => update({ followUpDate: addDays(today(), days) });

  return (
    <Sheet open onOpenChange={(open) => !open && openTask(null)}>
      <SheetContent
        // Sheet sides are physical; open from the inline-end edge in both directions.
        side={dir === 'rtl' ? 'left' : 'right'}
        className="w-full gap-0 overflow-y-auto data-[side=left]:sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="gap-1 border-b">
          <SheetDescription>{project?.name}</SheetDescription>
          <SheetTitle className="sr-only">{task.title}</SheetTitle>
          <Input
            dir="auto"
            className="h-auto border-transparent px-1 text-lg font-semibold shadow-none hover:border-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-label={t('field.title')}
          />
          {isOverdue(task) && (
            <Badge className="border-transparent bg-red-500/15 text-red-700 dark:text-red-300">{t('task.overdue')}</Badge>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          <div className="grid grid-cols-[6.5rem_1fr] items-center gap-x-3 gap-y-2">
            <Field label={t('field.status')}>
              <Select value={task.status} onValueChange={(v) => update({ status: v as Task['status'] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('field.assigneeId')}>
              <Select
                value={task.assigneeId ?? UNASSIGNED}
                onValueChange={(v) => update({ assigneeId: v === UNASSIGNED ? null : v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>{t('common.unassigned')}</SelectItem>
                  {data.members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <MemberAvatar member={m} size="sm" /> {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('field.priority')}>
              <Select value={task.priority} onValueChange={(v) => update({ priority: v as Task['priority'] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('field.dueDate')}>
              <DatePicker value={task.dueDate} onChange={(v) => update({ dueDate: v })} />
            </Field>

            <Field label={t('field.followUpDate')}>
              <DatePicker value={task.followUpDate} onChange={(v) => update({ followUpDate: v })} />
              <div className="mt-1 flex gap-1">
                {[1, 3, 7].map((d) => (
                  <Button key={d} dir="ltr" variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={() => followUpIn(d)}>
                    +{d === 7 ? '1w' : `${d}d`}
                  </Button>
                ))}
              </div>
            </Field>

            <Field label={t('field.listId')}>
              <Select value={task.listId} onValueChange={(v) => update({ listId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-2">
            <SectionTitle>{t('field.description')}</SectionTitle>
            <Textarea
              dir="auto"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== task.description && update({ description })}
            />
          </div>

          <div className="grid gap-3">
            <SectionTitle>{t('task.updates')}</SectionTitle>
            {comments.map((c) => {
              const author = data.members.find((m) => m.id === c.authorId);
              return (
                <div key={c.id} className="flex gap-3">
                  <MemberAvatar member={author} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{author?.name ?? t('common.unknown')}</span> ·{' '}
                      <time title={formatDateTime(c.createdAt)}>{formatRelative(c.createdAt)}</time>
                    </div>
                    <p dir="auto" className="text-sm whitespace-pre-wrap">
                      {c.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <form onSubmit={post} className="flex items-center gap-2">
              <MemberAvatar member={me} />
              <Input
                dir="auto"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('task.addComment')}
              />
              <Button type="submit" size="icon" disabled={!comment.trim()} aria-label={t('task.post')}>
                <SendIcon className="rtl:-scale-x-100" />
              </Button>
            </form>
          </div>

          <div className="grid gap-1">
            <SectionTitle>{t('task.history')}</SectionTitle>
            <ActivityFeed items={history} showProject={false} />
          </div>

          <Separator />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {t('task.created', { who: creator?.name ?? t('common.unknown'), when: formatDateTime(task.createdAt) })}
            </span>
            <Button variant="outline" size="sm" className="text-destructive" onClick={remove}>
              <Trash2Icon /> {t('common.delete')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
