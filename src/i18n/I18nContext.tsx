import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STRINGS, type Lang, type StringKey } from './strings';
import { readPref, writePref } from '../prefs';

interface I18n {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Format a YYYY-MM-DD date (no time zone shift). */
  formatDate: (date: string) => string;
  formatDateTime: (iso: string) => string;
  formatRelative: (iso: string) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (readPref('lang') === 'he' ? 'he' : 'en'));
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    writePref('lang', l);
  }, []);

  const value = useMemo<I18n>(() => {
    const locale = lang === 'he' ? 'he-IL' : 'en-GB';
    const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const dateTimeFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
    const rel = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    return {
      lang,
      dir,
      setLang,
      t: (key, vars) => {
        let s = STRINGS[lang][key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
        return s;
      },
      formatDate: (d) => dateFmt.format(new Date(`${d}T00:00:00Z`)),
      formatDateTime: (iso) => dateTimeFmt.format(new Date(iso)),
      formatRelative: (iso) => {
        const secs = (new Date(iso).getTime() - Date.now()) / 1000;
        const abs = Math.abs(secs);
        if (abs < 60) return rel.format(Math.round(secs), 'second');
        if (abs < 3600) return rel.format(Math.round(secs / 60), 'minute');
        if (abs < 86400) return rel.format(Math.round(secs / 3600), 'hour');
        if (abs < 86400 * 7) return rel.format(Math.round(secs / 86400), 'day');
        return dateTimeFmt.format(new Date(iso));
      },
    };
  }, [lang, dir, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
