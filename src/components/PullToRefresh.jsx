import { useRef, useState, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!isPulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff * 0.4);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance > 50 && !refreshing) {
      setRefreshing(true);
      setPullDistance(50);
      try {
        await onRefresh();
      } catch {}
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ height: `${pullDistance}px`, transition: refreshing ? 'none' : 'height 0.2s ease-out' }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <RefreshCw
              className="w-5 h-5 text-muted-foreground"
              style={{ transform: `rotate(${pullDistance * 3}deg)` }}
            />
          )}
        </div>
      )}
      {children}
    </div>
  );
}