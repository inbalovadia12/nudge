import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Splash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('thryve_splash_seen');
    if (!seen) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem('thryve_splash_seen', 'true');
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ rotate: -8 }}
              animate={{ rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mb-5"
            >
              <span className="text-3xl">💡</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl font-bold font-heading text-primary tracking-tight"
            >
              Thryve
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-sm text-muted-foreground mt-3"
            >
              Make smarter financial decisions.
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 1.8, ease: 'easeInOut' }}
            className="h-0.5 w-24 bg-primary/30 rounded-full mt-10 origin-center"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}