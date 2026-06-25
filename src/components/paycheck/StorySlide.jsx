import { motion } from 'framer-motion';

export default function StorySlide({ children, className = '' }) {
  return (
    <section className={`min-h-screen flex items-center justify-center relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md px-6 py-20"
      >
        {children}
      </motion.div>
    </section>
  );
}