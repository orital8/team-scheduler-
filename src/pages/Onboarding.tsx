import { useState, type FormEvent } from 'react';
import { ArrowLeftIcon, LanguagesIcon } from 'lucide-react';
import { MEMBER_COLORS, useApp } from '@/state/AppContext';
import { useTeamSession } from '@/state/TeamSession';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberAvatar } from '@/components/Avatar';

/** Shown after entering a team until this browser knows which member is using it. */
export function Onboarding() {
  const { team, data, store, setMe } = useApp();
  const { exit } = useTeamSession();
  const { t, lang, setLang } = useI18n();
  const [name, setName] = useState('');

  const start = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const m = await store.addMember(name, MEMBER_COLORS[data.members.length % MEMBER_COLORS.length]);
    setMe(m.id);
  };

  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <div className="grid w-full max-w-md gap-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="-ms-2" onClick={exit}>
            <ArrowLeftIcon className="rtl:-scale-x-100" /> {t('gate.back')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLang(lang === 'en' ? 'he' : 'en')}>
            <LanguagesIcon /> {t('lang.toggle')}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t('onboard.title', { team: team.name })}</CardTitle>
            <CardDescription>{t('onboard.body')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {data.members.length > 0 && (
              <div className="grid gap-2">
                <span className="text-xs text-muted-foreground">{t('onboard.pick')}</span>
                <div className="flex flex-wrap gap-2">
                  {data.members.map((m) => (
                    <Button key={m.id} variant="outline" size="sm" onClick={() => setMe(m.id)}>
                      <MemberAvatar member={m} size="sm" /> {m.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={start} className="flex gap-2">
              <Input
                autoFocus
                dir="auto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboard.yourName')}
              />
              <Button type="submit" disabled={!name.trim()}>
                {t('onboard.start')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
