import type { DataStore } from './store';
import {
  TRACKED_TASK_FIELDS,
  type Activity,
  type ActivityKind,
  type Comment,
  type ID,
  type Member,
  type Project,
  type Snapshot,
  type Task,
  type TaskInput,
  type TaskList,
  type TaskPatch,
} from '../types';

export const STORAGE_KEY = 'team-scheduler:data:v1';

/** Storage key for one team's data. */
export const teamDataKey = (teamId: string) => `team-scheduler:team:${teamId}:v1`;

/** Minimal subset of the Web Storage API, so tests can pass an in-memory one. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function emptySnapshot(): Snapshot {
  return { members: [], projects: [], lists: [], tasks: [], comments: [], activity: [] };
}

export function newId(): ID {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // crypto.randomUUID is missing on plain-http LAN origins.
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export class LocalStore implements DataStore {
  private data: Snapshot;
  private listeners = new Set<() => void>();

  constructor(
    private storage: KeyValueStorage,
    private now: () => Date = () => new Date(),
    private key: string = STORAGE_KEY,
  ) {
    this.data = this.read();
    if (typeof window !== 'undefined') {
      // Keep several open tabs in sync.
      window.addEventListener('storage', (e) => {
        if (e.key !== this.key) return;
        this.data = this.read();
        this.emit();
      });
    }
  }

  private read(): Snapshot {
    const raw = this.storage.getItem(this.key);
    if (!raw) return emptySnapshot();
    try {
      return { ...emptySnapshot(), ...(JSON.parse(raw) as Partial<Snapshot>) };
    } catch {
      return emptySnapshot();
    }
  }

  private commit() {
    this.storage.setItem(this.key, JSON.stringify(this.data));
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private ts() {
    return this.now().toISOString();
  }

  private log(actorId: ID, kind: ActivityKind, projectId: ID, taskId: ID | null, data: Activity['data'] = {}) {
    const project = this.data.projects.find((p) => p.id === projectId);
    this.data.activity.unshift({
      id: newId(),
      at: this.ts(),
      actorId,
      kind,
      projectId,
      taskId,
      // Names are copied in so history still reads well after deletions.
      data: { projectName: project?.name ?? null, ...data },
    });
  }

  private must<T extends { id: ID }>(items: T[], id: ID, what: string): T {
    const item = items.find((i) => i.id === id);
    if (!item) throw new Error(`${what} not found: ${id}`);
    return item;
  }

  async snapshot(): Promise<Snapshot> {
    return structuredClone(this.data);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Members

  async addMember(name: string, color: string): Promise<Member> {
    const member: Member = { id: newId(), name: name.trim(), color, createdAt: this.ts() };
    this.data.members.push(member);
    this.commit();
    return member;
  }

  async updateMember(id: ID, patch: Partial<Pick<Member, 'name' | 'color'>>) {
    Object.assign(this.must(this.data.members, id, 'Member'), patch);
    this.commit();
  }

  async removeMember(id: ID) {
    this.data.members = this.data.members.filter((m) => m.id !== id);
    for (const t of this.data.tasks) if (t.assigneeId === id) t.assigneeId = null;
    this.commit();
  }

  // Projects

  async createProject(actorId: ID, input: { name: string; description?: string }): Promise<Project> {
    const project: Project = {
      id: newId(),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      createdAt: this.ts(),
      createdBy: actorId,
    };
    this.data.projects.push(project);
    this.log(actorId, 'project.created', project.id, null);
    this.commit();
    return project;
  }

  async updateProject(actorId: ID, id: ID, patch: Partial<Pick<Project, 'name' | 'description'>>) {
    const project = this.must(this.data.projects, id, 'Project');
    const oldName = project.name;
    Object.assign(project, patch);
    if (patch.name !== undefined && patch.name !== oldName) {
      this.log(actorId, 'project.renamed', id, null, { from: oldName, to: patch.name });
    }
    this.commit();
  }

  async deleteProject(actorId: ID, id: ID) {
    this.must(this.data.projects, id, 'Project');
    this.log(actorId, 'project.deleted', id, null);
    const taskIds = new Set(this.data.tasks.filter((t) => t.projectId === id).map((t) => t.id));
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.data.lists = this.data.lists.filter((l) => l.projectId !== id);
    this.data.tasks = this.data.tasks.filter((t) => t.projectId !== id);
    this.data.comments = this.data.comments.filter((c) => !taskIds.has(c.taskId));
    this.commit();
  }

  // Lists

  async createList(actorId: ID, projectId: ID, name: string): Promise<TaskList> {
    this.must(this.data.projects, projectId, 'Project');
    const siblings = this.data.lists.filter((l) => l.projectId === projectId);
    const list: TaskList = {
      id: newId(),
      projectId,
      name: name.trim(),
      order: siblings.length ? Math.max(...siblings.map((l) => l.order)) + 1 : 0,
      createdAt: this.ts(),
    };
    this.data.lists.push(list);
    this.log(actorId, 'list.created', projectId, null, { list: list.name });
    this.commit();
    return list;
  }

  async renameList(actorId: ID, id: ID, name: string) {
    const list = this.must(this.data.lists, id, 'List');
    const from = list.name;
    list.name = name.trim();
    if (from !== list.name) this.log(actorId, 'list.renamed', list.projectId, null, { from, to: list.name });
    this.commit();
  }

  async deleteList(actorId: ID, id: ID) {
    const list = this.must(this.data.lists, id, 'List');
    const taskIds = new Set(this.data.tasks.filter((t) => t.listId === id).map((t) => t.id));
    this.log(actorId, 'list.deleted', list.projectId, null, { list: list.name, count: String(taskIds.size) });
    this.data.lists = this.data.lists.filter((l) => l.id !== id);
    this.data.tasks = this.data.tasks.filter((t) => t.listId !== id);
    this.data.comments = this.data.comments.filter((c) => !taskIds.has(c.taskId));
    this.commit();
  }

  // Tasks

  async createTask(actorId: ID, listId: ID, input: TaskInput): Promise<Task> {
    const list = this.must(this.data.lists, listId, 'List');
    const siblings = this.data.tasks.filter((t) => t.listId === listId);
    const ts = this.ts();
    const status = input.status ?? 'todo';
    const task: Task = {
      id: newId(),
      projectId: list.projectId,
      listId,
      title: input.title.trim(),
      description: input.description ?? '',
      status,
      priority: input.priority ?? 'medium',
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ?? null,
      followUpDate: input.followUpDate ?? null,
      order: siblings.length ? Math.max(...siblings.map((t) => t.order)) + 1 : 0,
      createdAt: ts,
      createdBy: actorId,
      updatedAt: ts,
      completedAt: status === 'done' ? ts : null,
    };
    this.data.tasks.push(task);
    this.log(actorId, 'task.created', task.projectId, task.id, { task: task.title, list: list.name });
    this.commit();
    return task;
  }

  async updateTask(actorId: ID, id: ID, patch: TaskPatch) {
    const task = this.must(this.data.tasks, id, 'Task');
    const before = { ...task };
    if (patch.listId !== undefined && patch.listId !== task.listId) {
      const target = this.must(this.data.lists, patch.listId, 'List');
      if (target.projectId !== task.projectId) throw new Error('Cannot move a task to another project');
    }
    Object.assign(task, patch);
    if (typeof patch.title === 'string') task.title = patch.title.trim();

    let changed = false;
    for (const field of TRACKED_TASK_FIELDS) {
      if (!(field in patch) || before[field] === task[field]) continue;
      changed = true;
      const values: Activity['data'] =
        field === 'description'
          ? {} // descriptions can be long; just record that it changed
          : field === 'listId'
            ? {
                from: this.data.lists.find((l) => l.id === before.listId)?.name ?? null,
                to: this.data.lists.find((l) => l.id === task.listId)?.name ?? null,
              }
            : { from: before[field], to: task[field] };
      this.log(actorId, 'task.updated', task.projectId, task.id, { task: task.title, field, ...values });
    }

    if (before.status !== task.status) {
      task.completedAt = task.status === 'done' ? this.ts() : null;
    }
    if (changed) task.updatedAt = this.ts();
    this.commit();
  }

  async deleteTask(actorId: ID, id: ID) {
    const task = this.must(this.data.tasks, id, 'Task');
    this.log(actorId, 'task.deleted', task.projectId, task.id, { task: task.title });
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.data.comments = this.data.comments.filter((c) => c.taskId !== id);
    this.commit();
  }

  async addComment(actorId: ID, taskId: ID, text: string): Promise<Comment> {
    const task = this.must(this.data.tasks, taskId, 'Task');
    const comment: Comment = { id: newId(), taskId, authorId: actorId, text: text.trim(), createdAt: this.ts() };
    this.data.comments.push(comment);
    this.log(actorId, 'task.commented', task.projectId, taskId, { task: task.title, text: comment.text.slice(0, 140) });
    task.updatedAt = comment.createdAt;
    this.commit();
    return comment;
  }

  async replaceAll(snapshot: Snapshot) {
    this.data = { ...emptySnapshot(), ...structuredClone(snapshot) };
    this.commit();
  }
}
