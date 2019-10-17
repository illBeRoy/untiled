import { useRef, useEffect } from 'react';

export const useOnMouseUp = (handler: (ev: WindowEventMap['mouseup']) => void) => {
  const currentHandler = useRef(handler);
  currentHandler.current = handler;

  useEffect(() => {
    const onMouseUp = (e) => {
      currentHandler.current(e);
    };

    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
};
