import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

const VARDIN_URL = 'https://vardin.base44.app';
const STORAGE_KEY = 'vardin_popup_last_shown';
const SHOW_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const INITIAL_DELAY_MS = 15 * 1000; // 15s after app load

const VARDIN_LOGO = 'https://media.base44.com/images/public/6a3ae5c0253dd0bc3229da04/e3749795d_generated_image.png';

export default function VardinPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!lastShown || now - parseInt(lastShown) > SHOW_INTERVAL_MS) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, INITIAL_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-card rounded-3xl border border-border max-w-sm w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg">
                <img src={VARDIN_LOGO} alt="Vardin" className="w-full h-full object-cover" />
              </div>

              <h2 className="text-xl font-bold font-heading text-foreground mb-1">Try Vardin</h2>
              <p className="text-xs font-medium text-primary mb-3">Scam Protection App</p>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Build good habits and protect yourself and your loved ones from scams. Vardin helps young people and the elderly spot and stop scams before they happen.
              </p>

              <a
                href={VARDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Try Vardin
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                onClick={dismiss}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}