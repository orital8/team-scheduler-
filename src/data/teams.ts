import type { ID, ISO } from '../types';
import { newId, type KeyValueStorage } from './localStore';

export interface Team {
  id: ID;
  name: string;
  createdAt: ISO;
  demo: boolean;
  /** PBKDF2-SHA256 hash of the team password (hex); null for the demo team. */
  passwordHash: string | null;
  salt: string | null;
}

export type TeamErrorCode = 'name_required' | 'weak_password' | 'name_taken' | 'bad_credentials';

export class TeamError extends Error {
  constructor(public code: TeamErrorCode) {
    super(code);
  }
}

export const MIN_PASSWORD = 4;

/**
 * Where teams are registered and passwords checked. The local implementation
 * only sees teams created in this browser; a server implementation makes
 * joining work across devices without UI changes.
 */
export interface TeamDirectory {
  get(id: ID): Promise<Team | null>;
  create(name: string, password: string): Promise<Team>;
  /** Resolves the team when name and password match; throws bad_credentials otherwise. */
  join(name: string, password: string): Promise<Team>;
  /** Returns the demo team, creating it on first use. */
  ensureDemo(): Promise<{ team: Team; created: boolean }>;
}

export const TEAMS_KEY = 'team-scheduler:teams:v1';
const ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

export class LocalTeamDirectory implements TeamDirectory {
  constructor(
    private storage: KeyValueStorage,
    private now: () => Date = () => new Date(),
  ) {}

  private read(): Team[] {
    try {
      return JSON.parse(this.storage.getItem(TEAMS_KEY) ?? '[]') as Team[];
    } catch {
      return [];
    }
  }

  private write(teams: Team[]) {
    this.storage.setItem(TEAMS_KEY, JSON.stringify(teams));
  }

  async get(id: ID) {
    return this.read().find((t) => t.id === id) ?? null;
  }

  async create(name: string, password: string): Promise<Team> {
    const clean = name.trim();
    if (!clean) throw new TeamError('name_required');
    if (password.length < MIN_PASSWORD) throw new TeamError('weak_password');
    const teams = this.read();
    if (teams.some((t) => !t.demo && sameName(t.name, clean))) throw new TeamError('name_taken');

    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const team: Team = {
      id: newId(),
      name: clean,
      createdAt: this.now().toISOString(),
      demo: false,
      salt,
      passwordHash: await hashPassword(password, salt),
    };
    this.write([...teams, team]);
    return team;
  }

  async join(name: string, password: string): Promise<Team> {
    const team = this.read().find((t) => !t.demo && sameName(t.name, name));
    // Same error for unknown team and wrong password, so names can't be probed.
    if (!team || !team.salt || (await hashPassword(password, team.salt)) !== team.passwordHash) {
      throw new TeamError('bad_credentials');
    }
    return team;
  }

  async ensureDemo() {
    const teams = this.read();
    const existing = teams.find((t) => t.demo);
    if (existing) return { team: existing, created: false };
    const team: Team = {
      id: newId(),
      name: 'Demo',
      createdAt: this.now().toISOString(),
      demo: true,
      salt: null,
      passwordHash: null,
    };
    this.write([...teams, team]);
    return { team, created: true };
  }
}
