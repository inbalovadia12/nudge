import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldCheck, Repeat } from 'lucide-react';

const projects = [
  {
    name: 'Vardin',
    tagline: 'Scam Protection App',
    description: 'Build good habits and protect yourself and your loved ones from scams. Vardin helps young people and the elderly spot and stop scams before they happen.',
    url: 'https://vardin.base44.app',
    logo: 'https://media.base44.com/images/public/6a3ae5c0253dd0bc3229da04/e3749795d_generated_image.png',
    icon: ShieldCheck,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    name: 'Habitude',
    tagline: 'Habit Building & Addiction Destroying',
    description: 'Build positive habits and break free from the ones holding you back. Habitude gives you the tools to track, manage, and conquer your routines.',
    url: 'https://habitude.base44.app/landing',
    logo: 'https://media.base44.com/images/public/6a3ae5c0253dd0bc3229da04/cd77feb24_generated_image.png',
    icon: Repeat,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
];

export default function MoreProjects() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">✨</span>
        <h1 className="text-2xl font-bold font-heading">More Projects</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Other apps we've built to help you live better.</p>

      <div className="space-y-4">
        {projects.map((project, i) => (
          <motion.a
            key={project.name}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="block rounded-3xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg font-bold font-heading text-foreground">{project.name}</h2>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className={`text-xs font-medium mb-2 ${project.color}`}>{project.tagline}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
              </div>
            </div>
            <div className={`mt-4 flex items-center justify-center gap-2 rounded-2xl ${project.bg} ${project.color} py-2.5 text-sm font-semibold`}>
              <project.icon className="w-4 h-4" />
              Visit {project.name}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}