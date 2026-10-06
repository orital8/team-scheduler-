import { useRef, useState, type FormEvent } from 'react';
import { DownloadIcon, PlusIcon, UploadIcon, UserMinusIcon } from 'lucide-react';
import { MEMBER_COLORS, useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { MemberAvatar } from '@/components/Avatar';
import { PageHeader } from '@/components/PageHeader';
import { useDialogs } from '@/components/dialogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Snapshot } from '@/types';

export function TeamPage() {
  const { team, data, store, me, setMe } = useApp();
  const { t } = useI18n();
  const dialogs = useDialogs();
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    store.addMember(name, MEMBER_COLORS[data.members.length % MEMBER_COLORS.length]);
    setName('');
  };

  const remove = async (id: string, memberName: string) => {
    const ok = await dialogs.confirm({
      title: t('team.remove'),
      description: t('common.confirmDelete', { name: memberName }),
      confirmLabel: t('team.remove'),
    });
    if (!ok) return;
    if (id === me?.id) setMe(null);
    store.removeMember(id);
  };

  const exportData = async () => {
    const blob = new Blob([JSON.stringify(await store.snapshot(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `team-scheduler-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    const ok = await dialogs.confirm({ title: t('team.import'), description: t('team.importConfirm'), confirmLabel: t('team.import') });
    if (!ok) return;
    const snap = JSON.parse(await file.text()) as Snapshot;
    if (!Array.isArray(snap.members) || !Array.isArray(snap.tasks)) throw new Error('Not a Team Scheduler export');
    await store.replaceAll(snap);
  };

  return (
    <>
      <PageHeader title={team.demo ? t('teams.demo') : team.name} description={t('team.title')} />
      {!team.demo && (
        <Card className="mb-6 gap-2 py-4">
          <CardHeader className="px-4">
            <CardTitle>{t('team.inviteTitle')}</CardTitle>
            <CardDescription>{t('team.inviteBody', { team: team.name })}</CardDescription>
          </CardHeader>
        </Card>
      )}
      <Card className="mb-6 gap-0 py-0">
        {data.members.map((m) => {
          const open = data.tasks.filter((x) => x.assigneeId === m.id && x.status !== 'done').length;
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
              <MemberAvatar member={m} size="lg" />
              <input
                type="color"
                className="h-8 w-8 cursor-pointer border bg-transparent p-0.5"
                value={m.color}
                onChange={(e) => store.updateMember(m.id, { color: e.target.value })}
                aria-label="Color"
              />
              <Input
                dir="auto"
                className="min-w-32 flex-1"
                defaultValue={m.name}
                onBlur={(e) => e.target.value.trim() && store.updateMember(m.id, { name: e.target.value.trim() })}
                aria-label={t('field.name')}
              />
              <span className="text-xs text-muted-foreground tabular-nums">{t('team.open', { n: open })}</span>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(m.id, m.name)}>
                <UserMinusIcon /> {t('team.remove')}
              </Button>
            </div>
          );
        })}
        <form onSubmit={add} className="flex gap-2 p-4">
          <Input dir="auto" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('team.namePlaceholder')} />
          <Button type="submit" disabled={!name.trim()}>
            <PlusIcon /> {t('team.add')}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('team.dataTitle')}</CardTitle>
          <CardDescription>{t('team.dataHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>
            <DownloadIcon /> {t('team.export')}
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <UploadIcon /> {t('team.import')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f).catch((err) => alert(String(err)));
              e.target.value = '';
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
