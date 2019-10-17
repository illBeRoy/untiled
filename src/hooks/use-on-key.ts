import { useRef, useEffect } from 'react';

export interface OnKeyHookOpts {
  key: string;
  withMeta?: boolean;
  handler(ev: WindowEventMap['keydown']): void;
}

export const useOnKey = ({ key, handler, withMeta = false }: OnKeyHookOpts) => {
  const currentKey = useRef(key);
  const currentHandler = useRef(handler);
  const currentMeta = useRef(withMeta);
  currentHandler.current = handler;
  currentKey.current = key;
  currentMeta.current = withMeta;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === currentKey.current && e.metaKey === currentMeta.current) {
        currentHandler.current(e);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
};
