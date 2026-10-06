import { beforeEach, describe, expect, it } from 'vitest';
import { LocalTeamDirectory, TEAMS_KEY, TeamError } from './teams';
import type { KeyValueStorage } from './localStore';

function memoryStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

const code = (p: Promise<unknown>) =>
  p.then(
    () => 'ok',
    (e) => (e instanceof TeamError ? e.code : String(e)),
  );

describe('LocalTeamDirectory', () => {
  let storage: ReturnType<typeof memoryStorage>;
  let dir: LocalTeamDirectory;

  beforeEach(() => {
    storage = memoryStorage();
    dir = new LocalTeamDirectory(storage);
  });

  it('creates a team without storing the password in plain text', async () => {
    const team = await dir.create('  Marketing ', 'sunflower');
    expect(team.name).toBe('Marketing');
    expect(storage.map.get(TEAMS_KEY)).not.toContain('sunflower');
    expect(team.passwordHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('joins with the right password, case-insensitive name', async () => {
    const team = await dir.create('Marketing', 'sunflower');
    const joined = await dir.join('marketing', 'sunflower');
    expect(joined.id).toBe(team.id);
  });

  it('rejects a wrong password and an unknown team the same way', async () => {
    await dir.create('Marketing', 'sunflower');
    expect(await code(dir.join('Marketing', 'Sunflower'))).toBe('bad_credentials');
    expect(await code(dir.join('Sales', 'sunflower'))).toBe('bad_credentials');
  });

  it('validates name, password length and duplicates', async () => {
    expect(await code(dir.create('  ', 'sunflower'))).toBe('name_required');
    expect(await code(dir.create('Ops', 'abc'))).toBe('weak_password');
    await dir.create('Ops', 'abcd');
    expect(await code(dir.create('OPS', 'other-pass'))).toBe('name_taken');
  });

  it('creates the demo team once and never lets anyone join it by password', async () => {
    const a = await dir.ensureDemo();
    const b = await dir.ensureDemo();
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.team.id).toBe(a.team.id);
    expect(await code(dir.join('Demo', ''))).toBe('bad_credentials');
  });
});
