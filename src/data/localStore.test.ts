import { beforeEach, describe, expect, it } from 'vitest';
import { LocalStore, STORAGE_KEY, type KeyValueStorage } from './localStore';

function memoryStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

describe('LocalStore', () => {
  let storage: ReturnType<typeof memoryStorage>;
  let store: LocalStore;
  let me: string;

  beforeEach(async () => {
    storage = memoryStorage();
    store = new LocalStore(storage, () => new Date('2026-10-06T09:00:00Z'));
    me = (await store.addMember('Dana', '#f00')).id;
  });

  it('persists to storage and reloads', async () => {
    const p = await store.createProject(me, { name: 'Launch' });
    const again = new LocalStore(storage);
    const snap = await again.snapshot();
    expect(snap.projects.map((x) => x.id)).toEqual([p.id]);
    expect(storage.map.has(STORAGE_KEY)).toBe(true);
  });

  it('logs one history entry per changed tracked field', async () => {
    const p = await store.createProject(me, { name: 'Launch' });
    const l = await store.createList(me, p.id, 'Backlog');
    const t = await store.createTask(me, l.id, { title: 'Write spec' });

    await store.updateTask(me, t.id, { status: 'in_progress', priority: 'medium', dueDate: '2026-10-10' });

    const { activity, tasks } = await store.snapshot();
    const updates = activity.filter((a) => a.kind === 'task.updated');
    expect(updates.map((a) => a.data.field).sort()).toEqual(['dueDate', 'status']);
    expect(updates.find((a) => a.data.field === 'status')?.data).toMatchObject({ from: 'todo', to: 'in_progress' });
    expect(tasks[0].completedAt).toBeNull();
  });

  it('sets and clears completedAt with status', async () => {
    const p = await store.createProject(me, { name: 'P' });
    const l = await store.createList(me, p.id, 'L');
    const t = await store.createTask(me, l.id, { title: 'T' });
    await store.updateTask(me, t.id, { status: 'done' });
    expect((await store.snapshot()).tasks[0].completedAt).toBe('2026-10-06T09:00:00.000Z');
    await store.updateTask(me, t.id, { status: 'todo' });
    expect((await store.snapshot()).tasks[0].completedAt).toBeNull();
  });

  it('keeps history after a project is deleted, with its name', async () => {
    const p = await store.createProject(me, { name: 'Old' });
    const l = await store.createList(me, p.id, 'L');
    const t = await store.createTask(me, l.id, { title: 'T' });
    await store.addComment(me, t.id, 'note');
    await store.deleteProject(me, p.id);

    const snap = await store.snapshot();
    expect(snap.projects).toHaveLength(0);
    expect(snap.lists).toHaveLength(0);
    expect(snap.tasks).toHaveLength(0);
    expect(snap.comments).toHaveLength(0);
    expect(snap.activity[0]).toMatchObject({ kind: 'project.deleted', data: { projectName: 'Old' } });
    expect(snap.activity.length).toBeGreaterThan(3);
  });

  it('refuses to move a task to another project', async () => {
    const a = await store.createProject(me, { name: 'A' });
    const b = await store.createProject(me, { name: 'B' });
    const la = await store.createList(me, a.id, 'L');
    const lb = await store.createList(me, b.id, 'L');
    const t = await store.createTask(me, la.id, { title: 'T' });
    await expect(store.updateTask(me, t.id, { listId: lb.id })).rejects.toThrow();
  });

  it('unassigns tasks when a member is removed', async () => {
    const other = await store.addMember('Avi', '#0f0');
    const p = await store.createProject(me, { name: 'P' });
    const l = await store.createList(me, p.id, 'L');
    await store.createTask(me, l.id, { title: 'T', assigneeId: other.id });
    await store.removeMember(other.id);
    expect((await store.snapshot()).tasks[0].assigneeId).toBeNull();
  });

  it('notifies subscribers on change', async () => {
    let calls = 0;
    const off = store.subscribe(() => calls++);
    await store.createProject(me, { name: 'P' });
    off();
    await store.createProject(me, { name: 'Q' });
    expect(calls).toBe(1);
  });
});
