export type ID = string;
/** Calendar date as YYYY-MM-DD (no time zone). */
export type DateStr = string;
/** Timestamp as ISO 8601 string. */
export type ISO = string;

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export interface Member {
  id: ID;
  name: string;
  color: string;
  createdAt: ISO;
}

export interface Project {
  id: ID;
  name: string;
  description: string;
  createdAt: ISO;
  createdBy: ID;
}

export interface TaskList {
  id: ID;
  projectId: ID;
  name: string;
  order: number;
  createdAt: ISO;
}

export interface Task {
  id: ID;
  projectId: ID;
  listId: ID;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: ID | null;
  dueDate: DateStr | null;
  followUpDate: DateStr | null;
  order: number;
  createdAt: ISO;
  createdBy: ID;
  updatedAt: ISO;
  completedAt: ISO | null;
}

export interface Comment {
  id: ID;
  taskId: ID;
  authorId: ID;
  text: string;
  createdAt: ISO;
}

export type ActivityKind =
  | 'project.created'
  | 'project.renamed'
  | 'project.deleted'
  | 'list.created'
  | 'list.renamed'
  | 'list.deleted'
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.commented';

export interface Activity {
  id: ID;
  at: ISO;
  actorId: ID;
  kind: ActivityKind;
  projectId: ID;
  taskId: ID | null;
  /** Free-form details used to render the entry (names, field, from/to). */
  data: Record<string, string | null>;
}

export interface Snapshot {
  members: Member[];
  projects: Project[];
  lists: TaskList[];
  tasks: Task[];
  comments: Comment[];
  activity: Activity[];
}

/** Task fields that are tracked field-by-field in the activity log. */
export const TRACKED_TASK_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'assigneeId',
  'dueDate',
  'followUpDate',
  'listId',
] as const;
export type TrackedTaskField = (typeof TRACKED_TASK_FIELDS)[number];

export type TaskInput = Partial<Pick<Task, TrackedTaskField>> & { title: string };
export type TaskPatch = Partial<Pick<Task, TrackedTaskField | 'order'>>;
