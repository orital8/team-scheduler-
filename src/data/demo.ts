import type { DataStore } from './store';
import { addDays, today } from '../dates';
import type { ID } from '../types';

/** Fill an empty store with a small realistic team. Returns the first member's id. */
export async function loadDemo(store: DataStore): Promise<ID> {
  const t = today();
  const [ori, dana, avi, noa] = await Promise.all([
    store.addMember('Ori', '#6366f1'),
    store.addMember('Dana', '#ec4899'),
    store.addMember('Avi', '#10b981'),
    store.addMember('Noa', '#f59e0b'),
  ]);

  const site = await store.createProject(ori.id, {
    name: 'Website relaunch',
    description: 'New marketing site for Q4.',
  });
  const design = await store.createList(dana.id, site.id, 'Design');
  const dev = await store.createList(avi.id, site.id, 'Development');
  const content = await store.createList(ori.id, site.id, 'Content');

  const hero = await store.createTask(dana.id, design.id, {
    title: 'Homepage hero mockups',
    assigneeId: dana.id,
    dueDate: addDays(t, -1),
    priority: 'high',
  });
  await store.updateTask(dana.id, hero.id, { status: 'in_progress' });
  await store.addComment(dana.id, hero.id, 'Two directions ready, waiting on brand feedback.');
  await store.createTask(dana.id, design.id, { title: 'Icon set', assigneeId: noa.id, dueDate: addDays(t, 6) });
  const cms = await store.createTask(avi.id, dev.id, {
    title: 'Pick a CMS',
    assigneeId: avi.id,
    followUpDate: t,
    status: 'blocked',
  });
  await store.addComment(avi.id, cms.id, 'Need budget approval before choosing.');
  await store.createTask(avi.id, dev.id, { title: 'Set up staging server', assigneeId: avi.id, dueDate: addDays(t, 3) });
  const copy = await store.createTask(ori.id, content.id, { title: 'About page copy', assigneeId: ori.id });
  await store.updateTask(ori.id, copy.id, { status: 'done' });
  await store.createTask(ori.id, content.id, {
    title: 'Customer quotes',
    assigneeId: noa.id,
    followUpDate: addDays(t, 2),
  });

  const hiring = await store.createProject(noa.id, { name: 'Hiring', description: 'Open roles for 2026.' });
  const pipeline = await store.createList(noa.id, hiring.id, 'Pipeline');
  await store.createTask(noa.id, pipeline.id, {
    title: 'Call back candidate for frontend role',
    assigneeId: noa.id,
    followUpDate: addDays(t, -2),
    priority: 'high',
  });
  await store.createTask(noa.id, pipeline.id, { title: 'Post QA job ad', assigneeId: ori.id, dueDate: addDays(t, 10) });

  return ori.id;
}
