import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EllipsisIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useI18n } from '@/i18n/I18nContext';
import { TaskRow } from '@/components/TaskRow';
import { ActivityFeed } from '@/components/ActivityFeed';
import { PageHeader } from '@/components/PageHeader';
import { useDialogs } from '@/components/dialogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task, TaskList } from '@/types';

export function ProjectPage() {
  const { projectId } = useParams();
  const { data, store, actor, me } = useApp();
  const { t } = useI18n();
  const dialogs = useDialogs();
  const navigate = useNavigate();
  const [tab, setTab] = useState('lists');
  const [showDone, setShowDone] = useState(false);
  const [who, setWho] = useState('all');

  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return <p className="text-sm text-muted-foreground">{t('project.notFound')}</p>;

  const lists = data.lists.filter((l) => l.projectId === project.id).sort((a, b) => a.order - b.order);
  const history = data.activity.filter((a) => a.projectId === project.id);

  const rename = async () => {
    const name = await dialogs.prompt({ title: t('common.rename'), label: t('project.namePrompt'), initial: project.name });
    if (name) store.updateProject(actor(), project.id, { name });
  };

  const remove = async () => {
    const ok = await dialogs.confirm({
      title: t('project.deleteProject'),
      description: t('common.confirmDelete', { name: project.name }),
    });
    if (!ok) return;
    await store.deleteProject(actor(), project.id);
    navigate('/');
  };

  const addList = async () => {
    const name = await dialogs.prompt({ title: t('project.newList'), label: t('project.listName') });
    if (name) store.createList(actor(), project.id, name);
  };

  const visible = (task: Task) => (showDone || task.status !== 'done') && (who === 'all' || task.assigneeId === me?.id);

  return (
    <>
      <PageHeader
        title={<span dir="auto">{project.name}</span>}
        description={project.description || undefined}
        actions={
          <>
            <Button onClick={addList}>
              <PlusIcon /> {t('project.newList')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t('common.actions')}>
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={rename}>
                  <PencilIcon /> {t('common.rename')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={remove} className="text-destructive">
                  <Trash2Icon /> {t('project.deleteProject')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="lists">{t('project.lists')}</TabsTrigger>
            <TabsTrigger value="history">{t('project.history')}</TabsTrigger>
          </TabsList>
          {tab === 'lists' && (
            <div className="flex items-center gap-4">
              <ToggleGroup type="single" variant="outline" size="sm" value={who} onValueChange={(v: string) => v && setWho(v)}>
                <ToggleGroupItem value="all">{t('common.all')}</ToggleGroupItem>
                <ToggleGroupItem value="mine">{t('common.mine')}</ToggleGroupItem>
              </ToggleGroup>
              <div className="flex items-center gap-2">
                <Checkbox id="show-done" checked={showDone} onCheckedChange={(v) => setShowDone(v === true)} />
                <Label htmlFor="show-done" className="text-xs text-muted-foreground">
                  {t('project.showDone')}
                </Label>
              </div>
            </div>
          )}
        </div>

        <TabsContents>
          <TabsContent value="lists" className="grid gap-4">
            {lists.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('project.noLists')}</p>
            ) : (
              lists.map((list) => (
                <ListSection
                  key={list.id}
                  list={list}
                  tasks={data.tasks.filter((x) => x.listId === list.id).sort((a, b) => a.order - b.order)}
                  visible={visible}
                />
              ))
            )}
          </TabsContent>
          <TabsContent value="history">
            <Card className="px-4 py-1">
              <ActivityFeed items={history} showProject={false} />
            </Card>
          </TabsContent>
        </TabsContents>
      </Tabs>
    </>
  );
}

function ListSection({ list, tasks, visible }: { list: TaskList; tasks: Task[]; visible: (t: Task) => boolean }) {
  const { store, actor, me } = useApp();
  const { t } = useI18n();
  const dialogs = useDialogs();
  const [title, setTitle] = useState('');
  const shown = tasks.filter(visible);
  const openCount = tasks.filter((x) => x.status !== 'done').length;

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    store.createTask(actor(), list.id, { title, assigneeId: me?.id ?? null });
    setTitle('');
  };

  const rename = async () => {
    const name = await dialogs.prompt({ title: t('common.rename'), label: t('project.listName'), initial: list.name });
    if (name) store.renameList(actor(), list.id, name);
  };

  const remove = async () => {
    const ok = await dialogs.confirm({ title: t('common.delete'), description: t('common.confirmDelete', { name: list.name }) });
    if (ok) store.deleteList(actor(), list.id);
  };

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <h2 dir="auto" className="font-heading text-sm font-semibold">
          {list.name}
        </h2>
        <span className="text-xs text-muted-foreground">{t('list.count', { n: openCount })}</span>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={rename}>
              <PencilIcon /> {t('common.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={remove} className="text-destructive">
              <Trash2Icon /> {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {shown.length === 0 && <p className="border-t px-4 py-3 text-xs text-muted-foreground">{t('list.empty')}</p>}
      {shown.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
      <form onSubmit={add} className="border-t p-2">
        <Input
          dir="auto"
          className="border-dashed shadow-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('list.addTask')}
        />
      </form>
    </Card>
  );
}
