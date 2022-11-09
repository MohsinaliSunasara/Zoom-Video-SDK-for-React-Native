import { useRef, useCallback, useEffect } from 'react';

export const useIsMounted = () => {
  const mountedRef = useRef(false);
  const isMounted = useCallback(() => mountedRef.current, []);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return isMounted;
};
