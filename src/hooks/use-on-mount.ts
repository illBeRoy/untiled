import { useEffect } from 'react';

export const useOnMount = (fn: (...args: any[]) => any) => {
  return useEffect(() => { fn(); }, []);
};

export const useOnUnmount = (fn: (...args: any[]) => any) => {
  return useEffect(() => fn, []);
};
