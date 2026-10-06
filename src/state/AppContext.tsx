import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DataStore } from '../data/store';
import type { ID, Member, Snapshot } from '../types';
import { emptySnapshot } from '../data/localStore';
import { readPref, writePref } from '../prefs';
import type { Team } from '../data/teams';

interface AppState {
  team: Team;
  store: DataStore;
  data: Snapshot;
  ready: boolean;
  me: Member | null;
  setMe: (id: ID | null) => void;
  /** Id of the acting member; throws if nobody is selected. */
  actor: () => ID;
  memberName: (id: ID | null | undefined) => string | null;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ team, store, children }: { team: Team; store: DataStore; children: ReactNode }) {
  // Who-am-I is remembered per team.
  const mePref = `me:${team.id}`;
  const [data, setData] = useState<Snapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);
  const [meId, setMeId] = useState<ID | null>(() => readPref(mePref));

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      store.snapshot().then((s) => {
        if (!alive) return;
        setData(s);
        setReady(true);
      });
    refresh();
    const off = store.subscribe(refresh);
    return () => {
      alive = false;
      off();
    };
  }, [store]);

  const setMe = useCallback((id: ID | null) => {
    setMeId(id);
    writePref(mePref, id);
  }, [mePref]);

  const me = data.members.find((m) => m.id === meId) ?? null;

  const value = useMemo<AppState>(
    () => ({
      team,
      store,
      data,
      ready,
      me,
      setMe,
      actor: () => {
        if (!me) throw new Error('No acting member selected');
        return me.id;
      },
      memberName: (id) => (id ? (data.members.find((m) => m.id === id)?.name ?? null) : null),
    }),
    [team, store, data, ready, me, setMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

export const MEMBER_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#84cc16'];
