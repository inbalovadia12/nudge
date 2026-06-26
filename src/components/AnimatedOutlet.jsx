import { useLocation, useOutlet, useNavigationType } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useLayoutEffect } from 'react';

const TAB_PATHS = ['/', '/insights', '/assistant', '/profile'];

export default function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const navType = useNavigationType();
  const cache = useRef({});
  const scrollPositions = useRef({});
  const prevPathRef = useRef(location.pathname);

  const currentPath = location.pathname;
  const isTabRoute = TAB_PATHS.includes(currentPath);
  const isBack = navType === 'POP';

  // Save scroll position when leaving a tab route
  const prevPath = prevPathRef.current;
  if (prevPath !== currentPath && TAB_PATHS.includes(prevPath)) {
    scrollPositions.current[prevPath] = window.scrollY;
  }
  prevPathRef.current = currentPath;

  // Cache outlet for tab routes so they stay mounted
  if (isTabRoute && outlet) {
    cache.current[currentPath] = outlet;
  }

  // Restore scroll position for tab routes; scroll to top for non-tab routes
  useLayoutEffect(() => {
    if (isTabRoute) {
      const saved = scrollPositions.current[currentPath];
      if (saved != null) {
        window.scrollTo(0, saved);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentPath, isTabRoute]);

  return (
    <>
      {/* Tab routes — kept alive with display toggle for state preservation */}
      <div style={{ display: isTabRoute ? 'block' : 'none' }}>
        {TAB_PATHS.map(path => {
          const isCurrent = path === currentPath;
          const cachedOutlet = cache.current[path];
          if (!cachedOutlet) return null;
          return (
            <div key={path} style={{ display: isCurrent ? 'block' : 'none' }}>
              {cachedOutlet}
            </div>
          );
        })}
      </div>

      {/* Non-tab routes — slide transitions via AnimatePresence */}
      {!isTabRoute && (
        <AnimatePresence mode="wait" initial={false} custom={isBack}>
          <motion.div
            key={currentPath}
            custom={isBack}
            initial={(back) => ({ x: back ? '-100%' : '100%', opacity: 0 })}
            animate={{ x: 0, opacity: 1 }}
            exit={(back) => ({ x: back ? '100%' : '-100%', opacity: 0 })}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}