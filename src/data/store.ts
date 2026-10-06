import type { Comment, ID, Member, Project, Snapshot, Task, TaskInput, TaskList, TaskPatch } from '../types';

/**
 * Persistence boundary. The UI talks only to this interface, so the
 * localStorage implementation can be swapped for a server/Supabase one later.
 * Mutations that matter for team history take the acting member's id; the
 * store is responsible for writing the activity log (a server would do this
 * in the same transaction).
 */
export interface DataStore {
  snapshot(): Promise<Snapshot>;
  /** Called whenever data changes (locally or from another tab/user). */
  subscribe(listener: () => void): () => void;

  addMember(name: string, color: string): Promise<Member>;
  updateMember(id: ID, patch: Partial<Pick<Member, 'name' | 'color'>>): Promise<void>;
  removeMember(id: ID): Promise<void>;

  createProject(actorId: ID, input: { name: string; description?: string }): Promise<Project>;
  updateProject(actorId: ID, id: ID, patch: Partial<Pick<Project, 'name' | 'description'>>): Promise<void>;
  deleteProject(actorId: ID, id: ID): Promise<void>;

  createList(actorId: ID, projectId: ID, name: string): Promise<TaskList>;
  renameList(actorId: ID, id: ID, name: string): Promise<void>;
  deleteList(actorId: ID, id: ID): Promise<void>;

  createTask(actorId: ID, listId: ID, input: TaskInput): Promise<Task>;
  updateTask(actorId: ID, id: ID, patch: TaskPatch): Promise<void>;
  deleteTask(actorId: ID, id: ID): Promise<void>;

  addComment(actorId: ID, taskId: ID, text: string): Promise<Comment>;

  /** Replace everything (used for demo data and JSON import). */
  replaceAll(snapshot: Snapshot): Promise<void>;
}
