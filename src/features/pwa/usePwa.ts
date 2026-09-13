import { useEffect, useState } from 'react';
import type { PwaAdapter } from '../../platform/pwa/PwaAdapter';

export function usePwa(adapter: PwaAdapter) {
  const [state, setState] = useState(adapter.getState());

  useEffect(() => {
    const unsubscribe = adapter.subscribe(setState);
    void adapter.register();
    return unsubscribe;
  }, [adapter]);

  return state;
}
