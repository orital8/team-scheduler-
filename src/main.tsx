import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Direction } from 'radix-ui';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { AppProvider } from './state/AppContext';
import { TeamSessionProvider, useTeamSession } from './state/TeamSession';
import { LocalTeamDirectory } from './data/teams';
import { DialogsProvider } from './components/dialogs';
import { Layout } from './components/Layout';
import { TeamGate } from './pages/TeamGate';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ActivityPage } from './pages/ActivityPage';
import { TeamPage } from './pages/TeamPage';
import './index.css';

// Swap for a server-backed directory (and DataStore in TeamSession) once the backend is chosen.
const directory = new LocalTeamDirectory(window.localStorage);

/** Follow the OS light/dark setting via the `.dark` class shadcn themes use. */
function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
}

/** Radix popups (select, menus) need the direction explicitly, not just <html dir>. */
function DirectionRoot({ children }: { children: ReactNode }) {
  const { dir } = useI18n();
  useSystemTheme();
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}

function TeamRoot() {
  const { team, ready, storeFor } = useTeamSession();
  if (!ready) return null;
  if (!team) return <TeamGate />;

  return (
    // Keyed by team so switching teams resets all per-team state.
    <AppProvider key={team.id} team={team} store={storeFor(team.id)}>
      {/* Hash routing works on any static host without rewrite rules. */}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="project/:projectId" element={<ProjectPage />} />
            <Route path="follow-ups" element={<FollowUpsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="team" element={<TeamPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <DirectionRoot>
        <DialogsProvider>
          <TeamSessionProvider directory={directory}>
            <TeamRoot />
          </TeamSessionProvider>
        </DialogsProvider>
      </DirectionRoot>
    </I18nProvider>
  </StrictMode>,
);
