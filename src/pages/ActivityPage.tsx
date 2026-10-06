import { useState } from 'react';
import { useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { ActivityFeed } from '@/components/ActivityFeed';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE = 100;
const ALL = '__all__';

export function ActivityPage() {
  const { data } = useApp();
  const { t } = useI18n();
  const [projectId, setProjectId] = useState(ALL);
  const [memberId, setMemberId] = useState(ALL);
  const [limit, setLimit] = useState(PAGE);

  // Include deleted projects so their history stays reachable.
  const projectOptions = new Map<string, string>();
  for (const a of data.activity) if (a.data.projectName) projectOptions.set(a.projectId, a.data.projectName);
  for (const p of data.projects) projectOptions.set(p.id, p.name);

  const items = data.activity.filter(
    (a) => (projectId === ALL || a.projectId === projectId) && (memberId === ALL || a.actorId === memberId),
  );

  return (
    <>
      <PageHeader
        title={t('act.title')}
        actions={
          <>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger size="sm" className="min-w-40" aria-label={t('act.filterProject')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('act.filterProject')}: {t('common.all')}
                </SelectItem>
                {[...projectOptions].map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger size="sm" className="min-w-40" aria-label={t('act.filterMember')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('act.filterMember')}: {t('common.all')}
                </SelectItem>
                {data.members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
      <Card className="px-4 py-1">
        <ActivityFeed items={items.slice(0, limit)} />
        {items.length > limit && (
          <Button variant="ghost" className="mx-auto my-2" onClick={() => setLimit((n) => n + PAGE)}>
            …
          </Button>
        )}
      </Card>
    </>
  );
}
