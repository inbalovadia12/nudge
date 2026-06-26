import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex-shrink-0">
          <Logo size="sm" />
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          <Link to="/blog/manage-money-beginners" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guides</Link>
          <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
            Log in
          </Link>
          <Link to="/register" className="text-sm font-semibold bg-primary text-primary-foreground rounded-xl px-4 py-2 hover:bg-primary/90 transition-colors">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}