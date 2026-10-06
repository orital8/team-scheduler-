import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ActivityIcon, BellRingIcon, FolderIcon, HouseIcon, LanguagesIcon, PlusIcon, UsersIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { isOverdue } from '@/dates';
import { Onboarding } from '@/pages/Onboarding';
import { MemberAvatar } from './Avatar';
import { TaskDrawer } from './TaskDrawer';
import { TeamSwitcher } from './TeamSwitcher';
import { useDialogs } from './dialogs';

function AppSidebar() {
  const { data, store, actor } = useApp();
  const { t, dir } = useI18n();
  const { isMobile, setOpenMobile } = useSidebar();
  const dialogs = useDialogs();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const overdue = data.tasks.filter((x) => isOverdue(x)).length;
  const go = () => isMobile && setOpenMobile(false);

  const nav = [
    { to: '/', label: t('nav.home'), icon: HouseIcon },
    { to: '/follow-ups', label: t('nav.followUps'), icon: BellRingIcon, badge: overdue || null },
    { to: '/activity', label: t('nav.activity'), icon: ActivityIcon },
    { to: '/team', label: t('nav.team'), icon: UsersIcon },
  ];

  const newProject = async () => {
    const name = await dialogs.prompt({ title: t('nav.newProject'), label: t('project.namePrompt') });
    if (!name) return;
    const p = await store.createProject(actor(), { name });
    // Every project starts with one list so tasks can be added right away.
    await store.createList(actor(), p.id, t('status.todo'));
    go();
    navigate(`/project/${p.id}`);
  };

  return (
    // Desktop sidebar uses logical start; the mobile sheet needs a physical side.
    <Sidebar side={isMobile && dir === 'rtl' ? 'right' : 'left'}>
      <SidebarHeader className="p-0">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={pathname === item.to}>
                    <Link to={item.to} onClick={go}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="top-1.5 bg-destructive text-white">{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.projects')}</SidebarGroupLabel>
          <SidebarGroupAction onClick={newProject} title={t('nav.newProject')} aria-label={t('nav.newProject')}>
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.projects.map((p) => {
                const open = data.tasks.filter((x) => x.projectId === p.id && x.status !== 'done').length;
                return (
                  <SidebarMenuItem key={p.id}>
                    <SidebarMenuButton asChild isActive={pathname === `/project/${p.id}`}>
                      <Link to={`/project/${p.id}`} onClick={go}>
                        <FolderIcon />
                        <span dir="auto">{p.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    {open > 0 && <SidebarMenuBadge className="top-1.5">{open}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function Layout() {
  const { data, me, setMe, ready } = useApp();
  const { t, lang, setLang } = useI18n();
  const [params] = useSearchParams();

  if (!ready) return null;
  if (!me) return <Onboarding />;

  const openTask = data.tasks.find((x) => x.id === params.get('task'));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-3">
          <SidebarTrigger className="rtl:-scale-x-100" aria-label={t('nav.toggle')} />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1" />
          <span className="hidden text-xs text-muted-foreground sm:inline">{t('header.actingAs')}</span>
          <Select value={me.id} onValueChange={setMe}>
            <SelectTrigger size="sm" className="min-w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <MemberAvatar member={m} size="sm" /> {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setLang(lang === 'en' ? 'he' : 'en')}>
            <LanguagesIcon /> {t('lang.toggle')}
          </Button>
        </header>
        <main className="mx-auto w-full max-w-5xl p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>

      {openTask && <TaskDrawer key={openTask.id} task={openTask} />}
    </SidebarProvider>
  );
}
