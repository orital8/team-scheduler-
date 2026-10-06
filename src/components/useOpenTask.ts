import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ID } from '../types';

/** The open task lives in the URL (?task=id) so it can be linked and survives reloads. */
export function useOpenTask() {
  const [params, setParams] = useSearchParams();
  return useCallback(
    (id: ID | null) => {
      const next = new URLSearchParams(params);
      if (id) next.set('task', id);
      else next.delete('task');
      setParams(next);
    },
    [params, setParams],
  );
}
