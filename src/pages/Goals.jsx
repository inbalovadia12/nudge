import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import GoalCard from '@/components/GoalCard';
import { goalOptions, getGoalIcon } from '@/lib/nudgeUtils';
import { Plus, X } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('plane');
  const [newTarget, setNewTarget] = useState(2000);

  const loadGoals = async () => {
    const data = await base44.entities.SavingsGoal.filter({ status: 'active' });
    setGoals(data);
    setLoading(false);
  };

  useEffect(() => { loadGoals(); }, []);

  const handleAddGoal = async () => {
    if (!newName.trim()) return;
    await base44.entities.SavingsGoal.create({
      name: newName.trim(),
      target_amount: newTarget,
      current_amount: 0,
      icon: newIcon,
      status: 'active',
      is_primary: false
    });
    setShowAdd(false);
    setNewName('');
    setNewTarget(2000);
    setNewIcon('plane');
    loadGoals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-surface-3 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your goals</h1>
          <p className="text-muted-foreground mt-1 text-sm">What you're working toward.</p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-1" /> New goal
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GoalCard goal={goal} />
          </motion.div>
        ))}
      </div>

      {goals.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">No goals yet. Add one to get started.</p>
          <Button onClick={() => setShowAdd(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Add your first goal
          </Button>
        </div>
      )}

      {/* Add goal modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface-1 border border-border rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">New goal</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Goal name</label>
                <input
                  type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Trip to Japan"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Pick an icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {goalOptions.map(opt => {
                    const Icon = getGoalIcon(opt.icon);
                    return (
                      <button
                        key={opt.icon}
                        onClick={() => setNewIcon(opt.icon)}
                        className={`aspect-square rounded-xl flex items-center justify-center border transition-colors ${newIcon === opt.icon ? 'border-primary bg-primary/5' : 'border-border bg-surface-2'}`}
                      >
                        <Icon className={`w-5 h-5 ${newIcon === opt.icon ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="text-sm text-muted-foreground">Target amount</label>
                  <span className="text-xl font-bold text-primary">${newTarget.toLocaleString()}</span>
                </div>
                <input
                  type="range" min="500" max="20000" step="100"
                  value={newTarget}
                  onChange={e => setNewTarget(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <Button
                onClick={handleAddGoal}
                disabled={!newName.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12"
              >
                Add goal
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}