import { createContext, useCallback, useContext, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useI18n } from '@/i18n/I18nContext';

interface PromptOptions {
  title: string;
  label?: string;
  initial?: string;
}
interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
}
interface Dialogs {
  /** Ask for a short text value; resolves null when cancelled or empty. */
  prompt: (o: PromptOptions) => Promise<string | null>;
  /** Ask for confirmation of a destructive action. */
  confirm: (o: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<Dialogs | null>(null);

type Pending =
  | ({ kind: 'prompt'; resolve: (v: string | null) => void } & PromptOptions)
  | ({ kind: 'confirm'; resolve: (v: boolean) => void } & ConfirmOptions);

/** Promise-based replacements for window.prompt / window.confirm. */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [pending, setPending] = useState<Pending | null>(null);
  const [value, setValue] = useState('');
  const settled = useRef(false);
  // Opened imperatively (no Radix trigger), so focus has to be returned by hand.
  const returnFocus = useRef<HTMLElement | null>(null);

  const finish = useCallback((result: string | null | boolean) => {
    setPending((p) => {
      if (p && !settled.current) {
        settled.current = true;
        if (p.kind === 'prompt') p.resolve(typeof result === 'string' ? result : null);
        else p.resolve(result === true);
      }
      return null;
    });
  }, []);

  const begin = () => {
    settled.current = false;
    returnFocus.current = document.activeElement as HTMLElement | null;
  };
  const restoreFocus = (e: Event) => {
    e.preventDefault();
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
  };

  const api: Dialogs = {
    prompt: (o) =>
      new Promise((resolve) => {
        begin();
        setValue(o.initial ?? '');
        setPending({ kind: 'prompt', resolve, ...o });
      }),
    confirm: (o) =>
      new Promise((resolve) => {
        begin();
        setPending({ kind: 'confirm', resolve, ...o });
      }),
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    finish(value.trim() || null);
  };

  return (
    <Ctx.Provider value={api}>
      {children}

      <Dialog open={pending?.kind === 'prompt'} onOpenChange={(open) => !open && finish(null)}>
        <DialogContent className="sm:max-w-md" onCloseAutoFocus={restoreFocus}>
          {pending?.kind === 'prompt' && (
            <form onSubmit={submit} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>{pending.title}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                {pending.label && <Label htmlFor="prompt-input">{pending.label}</Label>}
                <Input id="prompt-input" autoFocus dir="auto" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => finish(null)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={!value.trim()}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pending?.kind === 'confirm'} onOpenChange={(open) => !open && finish(false)}>
        <AlertDialogContent onCloseAutoFocus={restoreFocus}>
          {pending?.kind === 'confirm' && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{pending.title}</AlertDialogTitle>
                {pending.description && <AlertDialogDescription>{pending.description}</AlertDialogDescription>}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => finish(true)}
                >
                  {pending.confirmLabel ?? t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
}

export function useDialogs() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDialogs outside DialogsProvider');
  return v;
}
