import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DataStore } from '@/data/store';
import { LocalStore, teamDataKey } from '@/data/localStore';
import { loadDemo } from '@/data/demo';
import type { Team, TeamDirectory } from '@/data/teams';
import type { ID } from '@/types';
import { readPref, writePref } from '@/prefs';

interface TeamSession {
  directory: TeamDirectory;
  /** Team currently open, or null to show the team gate. */
  team: Team | null;
  /** Teams this browser has created or joined, for the switcher. */
  joined: Team[];
  ready: boolean;
  storeFor: (teamId: ID) => DataStore;
  /** Open a team. `askWho` forgets the remembered member so the joiner picks who they are. */
  enter: (team: Team, opts?: { askWho?: boolean }) => void;
  /** Close the current team and go back to the gate (stays in `joined`). */
  exit: () => void;
  /** Open the demo team, seeding it the first time. Returns the demo member to act as. */
  launchDemo: () => Promise<void>;
}

const Ctx = createContext<TeamSession | null>(null);

const readJoined = (): ID[] => {
  try {
    return JSON.parse(readPref('teams') ?? '[]') as ID[];
  } catch {
    return [];
  }
};

export function TeamSessionProvider({ directory, children }: { directory: TeamDirectory; children: ReactNode }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [joined, setJoined] = useState<Team[]>([]);
  const [ready, setReady] = useState(false);
  // One store per team, so tab-sync listeners aren't duplicated when switching.
  const [stores] = useState(() => new Map<ID, DataStore>());

  const storeFor = useCallback(
    (teamId: ID) => {
      let s = stores.get(teamId);
      if (!s) {
        s = new LocalStore(window.localStorage, undefined, teamDataKey(teamId));
        stores.set(teamId, s);
      }
      return s;
    },
    [stores],
  );

  useEffect(() => {
    (async () => {
      const teams = (await Promise.all(readJoined().map((id) => directory.get(id)))).filter((t): t is Team => !!t);
      setJoined(teams);
      const current = readPref('team');
      setTeam(teams.find((t) => t.id === current) ?? null);
      setReady(true);
    })();
  }, [directory]);

  const enter = useCallback((t: Team, opts?: { askWho?: boolean }) => {
    if (opts?.askWho) writePref(`me:${t.id}`, null);
    // Routes hold ids from the previous team (projects, open task); start fresh.
    window.location.hash = '#/';
    setTeam(t);
    writePref('team', t.id);
    setJoined((prev) => {
      const next = prev.some((x) => x.id === t.id) ? prev : [...prev, t];
      writePref('teams', JSON.stringify(next.map((x) => x.id)));
      return next;
    });
  }, []);

  const exit = useCallback(() => {
    setTeam(null);
    writePref('team', null);
  }, []);

  const launchDemo = useCallback(async () => {
    const { team: demo, created } = await directory.ensureDemo();
    if (created) {
      const meId = await loadDemo(storeFor(demo.id));
      writePref(`me:${demo.id}`, meId);
    }
    enter(demo);
  }, [directory, storeFor, enter]);

  const value = useMemo(
    () => ({ directory, team, joined, ready, storeFor, enter, exit, launchDemo }),
    [directory, team, joined, ready, storeFor, enter, exit, launchDemo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTeamSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTeamSession outside TeamSessionProvider');
  return v;
}
