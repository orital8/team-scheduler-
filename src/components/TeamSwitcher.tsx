import { CheckIcon, ChevronsUpDownIcon, PlayIcon, PlusIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/state/AppContext';
import { useTeamSession } from '@/state/TeamSession';
import { useI18n } from '@/i18n/I18nContext';

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

export function TeamSwitcher() {
  const { team } = useApp();
  const { joined, enter, exit, launchDemo } = useTeamSession();
  const { t } = useI18n();
  const label = (name: string, demo: boolean) => (demo ? t('teams.demo') : name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-12 w-full items-center gap-2 border-b px-3 text-start outline-hidden hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring">
        <span className="grid size-7 shrink-0 place-items-center bg-primary text-xs font-bold text-primary-foreground">
          {initial(label(team.name, team.demo))}
        </span>
        <span className="grid min-w-0 flex-1 leading-tight">
          <span dir="auto" className="truncate font-heading text-sm font-bold">
            {label(team.name, team.demo)}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">{t('appName')}</span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t('teams.switch')}</DropdownMenuLabel>
        {joined.map((x) => (
          <DropdownMenuItem key={x.id} onSelect={() => x.id !== team.id && enter(x)}>
            <span className="grid size-5 place-items-center border text-[10px] font-bold">{initial(label(x.name, x.demo))}</span>
            <span dir="auto" className="flex-1 truncate">
              {label(x.name, x.demo)}
            </span>
            {x.id === team.id && <CheckIcon />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={exit}>
          <PlusIcon /> {t('teams.other')}
        </DropdownMenuItem>
        {!joined.some((x) => x.demo) && (
          <DropdownMenuItem onSelect={launchDemo}>
            <PlayIcon /> {t('gate.demo')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
