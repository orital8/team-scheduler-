import { Link } from 'react-router-dom';
import { useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { ActivityFeed } from '@/components/ActivityFeed';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isOverdue, today } from '@/dates';

export function HomePage() {
  const { data } = useApp();
  const { t } = useI18n();
  const now = today();
  const weekAgo = Date.now() - 7 * 86400_000;
  const open = data.tasks.filter((x) => x.status !== 'done');

  const stats = [
    { label: t('home.openTasks'), value: open.length },
    { label: t('home.overdue'), value: open.filter((x) => isOverdue(x, now)).length, warn: true },
    { label: t('home.followUpsToday'), value: open.filter((x) => x.followUpDate && x.followUpDate <= now).length },
    {
      label: t('home.doneThisWeek'),
      value: data.tasks.filter((x) => x.completedAt && new Date(x.completedAt).getTime() >= weekAgo).length,
    },
  ];

  return (
    <>
      <PageHeader title={t('home.title')} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const alert = s.warn && s.value > 0;
          return (
            <Card key={s.label} className={cn('gap-1 py-4', alert && 'border-destructive')}>
              <CardContent className="px-4">
                <div className={cn('font-heading text-3xl font-bold tabular-nums', alert && 'text-destructive')}>
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('home.noProjects')}</p>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((p) => {
            const tasks = data.tasks.filter((x) => x.projectId === p.id);
            const done = tasks.filter((x) => x.status === 'done').length;
            const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
            return (
              <Link key={p.id} to={`/project/${p.id}`} className="group">
                <Card className="h-full gap-3 py-4 transition-colors group-hover:border-foreground/40">
                  <CardHeader className="px-4">
                    <CardTitle dir="auto">{p.name}</CardTitle>
                    {p.description && <CardDescription dir="auto">{p.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="grid gap-1.5 px-4">
                    <div className="h-1.5 bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-emerald-500" style={{ inlineSize: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {done}/{tasks.length}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Card className="gap-2">
        <CardHeader>
          <CardTitle>{t('home.recent')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed items={data.activity.slice(0, 12)} />
        </CardContent>
      </Card>
    </>
  );
}
