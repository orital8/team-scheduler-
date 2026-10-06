import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LanguagesIcon,
  LogInIcon,
  PlayIcon,
  PlusIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTeamSession } from '@/state/TeamSession';
import { MIN_PASSWORD, TeamError, type Team } from '@/data/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Step = 'start' | 'build' | 'create' | 'join' | 'created';

/** Full-screen flow shown until a team is open: build (create/join) or launch the demo. */
export function TeamGate() {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState<Step>('start');
  const [created, setCreated] = useState<{ team: Team; password: string } | null>(null);

  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <div className="w-full max-w-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="font-heading text-sm font-bold">{t('appName')}</span>
          <Button variant="outline" size="sm" onClick={() => setLang(lang === 'en' ? 'he' : 'en')}>
            <LanguagesIcon /> {t('lang.toggle')}
          </Button>
        </div>

        {step === 'start' && <Start onBuild={() => setStep('build')} />}
        {step === 'build' && (
          <Build onBack={() => setStep('start')} onCreate={() => setStep('create')} onJoin={() => setStep('join')} />
        )}
        {step === 'create' && (
          <CreateTeam
            onBack={() => setStep('build')}
            onCreated={(team, password) => {
              setCreated({ team, password });
              setStep('created');
            }}
          />
        )}
        {step === 'join' && <JoinTeam onBack={() => setStep('build')} />}
        {step === 'created' && created && <Created {...created} />}

        <p className="mt-4 text-xs text-muted-foreground">{t('gate.localNote')}</p>
      </div>
    </div>
  );
}

function Choice({
  icon: Icon,
  title,
  body,
  onClick,
  primary,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button onClick={onClick} className="group text-start">
      <Card
        className={
          'h-full gap-2 py-5 transition-colors group-hover:border-foreground/50 group-focus-visible:border-ring ' +
          (primary ? 'border-foreground/30' : '')
        }
      >
        <CardHeader className="px-5">
          <Icon className="mb-2 size-6" />
          <CardTitle className="font-heading">{title}</CardTitle>
          <CardDescription>{body}</CardDescription>
        </CardHeader>
      </Card>
    </button>
  );
}

function Start({ onBuild }: { onBuild: () => void }) {
  const { t } = useI18n();
  const { joined, enter, launchDemo } = useTeamSession();
  const teams = joined.filter((x) => !x.demo);

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t('gate.welcome')}</h1>
        <p className="text-sm text-muted-foreground">{t('gate.welcomeBody')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice icon={UsersIcon} title={t('gate.build')} body={t('gate.buildBody')} onClick={onBuild} primary />
        <Choice icon={PlayIcon} title={t('gate.demo')} body={t('gate.demoBody')} onClick={launchDemo} />
      </div>
      {teams.length > 0 && (
        <Card className="gap-2 py-4">
          <CardHeader className="px-4">
            <CardDescription>{t('gate.yourTeams')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 px-4">
            {teams.map((team) => (
              <Button key={team.id} variant="outline" onClick={() => enter(team)}>
                <LogInIcon className="rtl:-scale-x-100" /> <span dir="auto">{team.name}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <Button variant="ghost" size="sm" className="-ms-2 w-fit" onClick={onClick}>
      <ArrowLeftIcon className="rtl:-scale-x-100" /> {t('gate.back')}
    </Button>
  );
}

function Build({ onBack, onCreate, onJoin }: { onBack: () => void; onCreate: () => void; onJoin: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4">
      <BackButton onClick={onBack} />
      <h1 className="font-heading text-2xl font-bold">{t('gate.build')}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice icon={PlusIcon} title={t('gate.create')} body={t('gate.createBody')} onClick={onCreate} primary />
        <Choice icon={LogInIcon} title={t('gate.join')} body={t('gate.joinBody')} onClick={onJoin} />
      </div>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="flex">
      <Input
        id={id}
        dir="ltr"
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="-ms-px shrink-0"
        onClick={() => setShow((s) => !s)}
        aria-label={t('gate.showPassword')}
        aria-pressed={show}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
    </div>
  );
}

function useTeamError() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const fail = (e: unknown) => {
    if (e instanceof TeamError) setError(t(`gate.err.${e.code}`, { n: MIN_PASSWORD }));
    else setError(String(e));
  };
  return { error, setError, fail };
}

function CreateTeam({ onBack, onCreated }: { onBack: () => void; onCreated: (team: Team, password: string) => void }) {
  const { t } = useI18n();
  const { directory } = useTeamSession();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const { error, setError, fail } = useTeamError();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError(t('gate.mismatch'));
    setBusy(true);
    try {
      onCreated(await directory.create(name, password), password);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <BackButton onClick={onBack} />
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t('gate.create')}</CardTitle>
          <CardDescription>{t('gate.createBody')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field id="team-name" label={t('gate.teamName')}>
            <Input id="team-name" dir="auto" autoFocus autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="team-password" label={t('gate.password')} hint={t('gate.passwordHint', { n: MIN_PASSWORD })}>
            <PasswordInput id="team-password" autoComplete="new-password" value={password} onChange={setPassword} />
          </Field>
          <Field id="team-password2" label={t('gate.confirmPassword')}>
            <PasswordInput id="team-password2" autoComplete="new-password" value={confirm} onChange={setConfirm} />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={busy || !name.trim() || !password || !confirm}>
            {t('gate.createSubmit')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function JoinTeam({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { directory, enter } = useTeamSession();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { error, fail } = useTeamError();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      enter(await directory.join(name, password), { askWho: true });
    } catch (err) {
      fail(err);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <BackButton onClick={onBack} />
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t('gate.join')}</CardTitle>
          <CardDescription>{t('gate.joinBody')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field id="join-name" label={t('gate.teamName')}>
            <Input id="join-name" dir="auto" autoFocus autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="join-password" label={t('gate.password')}>
            <PasswordInput id="join-password" autoComplete="current-password" value={password} onChange={setPassword} />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={busy || !name.trim() || !password}>
            {t('gate.joinSubmit')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function Created({ team, password }: { team: Team; password: string }) {
  const { t } = useI18n();
  const { enter } = useTeamSession();
  const [copied, setCopied] = useState(false);
  const invite = t('gate.inviteText', { team: team.name, password });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. plain http); the details are on screen to copy by hand.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">{t('gate.createdTitle', { team: team.name })}</CardTitle>
        <CardDescription>{t('gate.createdBody')}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border bg-muted/50 p-4 text-sm">
          <dt className="text-muted-foreground">{t('gate.teamName')}</dt>
          <dd dir="auto" className="font-semibold">
            {team.name}
          </dd>
          <dt className="text-muted-foreground">{t('gate.password')}</dt>
          <dd dir="ltr" className="text-start font-semibold">
            {password}
          </dd>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? t('gate.copied') : t('gate.copy')}
        </Button>
        <Button className="flex-1" onClick={() => enter(team)}>
          {t('gate.continue')}
        </Button>
      </CardFooter>
    </Card>
  );
}
