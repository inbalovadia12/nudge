import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ChildHeader({ title, showBack = true, children }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="relative flex items-center justify-between mb-6">
      {showBack ? (
        <button
          onClick={handleBack}
          className="w-11 h-11 -ml-2 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      ) : (
        <div className="w-11 flex-shrink-0" />
      )}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold font-heading text-foreground text-center px-4 truncate max-w-[60%]">
        {title}
      </h1>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}