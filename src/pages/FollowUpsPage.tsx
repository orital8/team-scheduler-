import { useState } from 'react';
import { useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { TaskRow } from '@/components/TaskRow';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { attentionDate, bucketOf, today, type Bucket } from '@/dates';
import type { Task } from '@/types';

const BUCKETS: Bucket[] = ['overdue', 'today', 'week', 'later'];

export function FollowUpsPage() {
  const { data, me } = useApp();
  const { t } = useI18n();
  const [who, setWho] = useState('mine');
  const now = today();

  const groups = new Map<Bucket, Task[]>(BUCKETS.map((b) => [b, []]));
  data.tasks
    .filter((x) => x.status !== 'done' && (who === 'all' || x.assigneeId === me?.id))
    .map((x) => ({ task: x, date: attentionDate(x) }))
    .filter((x): x is { task: Task; date: string } => x.date !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(({ task, date }) => groups.get(bucketOf(date, now))!.push(task));

  const total = [...groups.values()].reduce((n, g) => n + g.length, 0);

  return (
    <>
      <PageHeader
        title={t('fu.title')}
        description={t('fu.hint')}
        actions={
          <ToggleGroup type="single" variant="outline" size="sm" value={who} onValueChange={(v: string) => v && setWho(v)}>
            <ToggleGroupItem value="mine">{t('common.mine')}</ToggleGroupItem>
            <ToggleGroupItem value="all">{t('common.all')}</ToggleGroupItem>
          </ToggleGroup>
        }
      />

      {total === 0 && <p className="text-sm text-muted-foreground">{t('fu.none')}</p>}
      <div className="grid gap-4">
        {BUCKETS.map((b) => {
          const tasks = groups.get(b)!;
          if (!tasks.length) return null;
          return (
            <Card key={b} className={cn('gap-0 py-0', b === 'overdue' && 'border-destructive')}>
              <div className="flex items-center gap-2 px-4 py-2.5">
                <h2 className={cn('font-heading text-sm font-semibold', b === 'overdue' && 'text-destructive')}>
                  {t(`fu.${b}`)}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">{tasks.length}</span>
              </div>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} showProject />
              ))}
            </Card>
          );
        })}
      </div>
    </>
  );
}
