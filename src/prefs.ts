// Per-browser UI preferences (language, "acting as" member). Not team data.
const PREFIX = 'team-scheduler:pref:';

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage blocked; preference just won't persist.
  }
}
