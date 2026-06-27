import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/nudgeUtils';
import { usePremiumStatus } from '@/lib/usePremium';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Bell, TrendingDown, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const dealQualityColors = {
  A: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/30' },
  B: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  C: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30' },
  D: { bg: 'bg-muted/15', text: 'text-muted-foreground', border: 'border-border' },
};

function generatePriceHistory(currentPrice, historicalLow) {
  const data = [];
  const today = new Date();
  for (let i = 90; i >= 0; i -= 7) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const variance = Math.random() * (currentPrice - historicalLow) * 0.6;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Math.round(historicalLow + variance),
    });
  }
  data[data.length - 1].price = currentPrice;
  return data;
}

export default function Deals() {
  const { isPremium, loading } = usePremiumStatus();
  const [products, setProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.TrackedProduct.list('-updated_date', 50)
      .then(all => setProducts(all.filter(p => p.status === 'tracking' || p.status === 'alert')))
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, []);

  if (loading || dataLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!isPremium) {
    return (
      <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <h1 className="text-2xl font-bold font-heading mb-2">Deal Center</h1>
        <p className="text-sm text-muted-foreground mb-6">Track any product. Nudigo alerts you only when it's genuinely worth buying.</p>

        <div className="space-y-3 mb-6 blur-sm pointer-events-none select-none">
          {products.slice(0, 2).map((p, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.product_name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(p.current_price)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <PaywallCard
          title="Smart deal alerts"
          description="Price predictions, deal quality scores, and alerts only when a purchase fits your budget and timeline."
          onUpgrade={() => {}}
        />
      </div>
    );
  }

  const alerts = products.filter(p => p.status === 'alert');
  const tracking = products.filter(p => p.status === 'tracking');

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <h1 className="text-2xl font-bold font-heading mb-6">Deal Center</h1>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Active alerts</h2>
          </div>
          <div className="space-y-3">
            {alerts.map(p => (
              <DealCard key={p.id} product={p} onSelect={setSelected} isSelected={selected?.id === p.id} />
            ))}
          </div>
        </div>
      )}

      {/* Tracking */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Tracking</h2>
        <div className="space-y-3">
          {tracking.map(p => (
            <DealCard key={p.id} product={p} onSelect={setSelected} isSelected={selected?.id === p.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DealCard({ product, onSelect, isSelected }) {
  const [showHistory, setShowHistory] = useState(isSelected);
  const config = dealQualityColors[product.deal_quality] || dealQualityColors.C;
  const priceHistory = generatePriceHistory(product.current_price, product.historical_low);
  const isAtTarget = product.current_price <= product.target_price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button onClick={() => { onSelect(product); setShowHistory(!showHistory); }} className="w-full text-left p-4">
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img src={product.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{product.product_name}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(product.current_price)}</p>
              {isAtTarget && (
                <span className="flex items-center gap-0.5 text-[10px] text-success font-medium">
                  <Check className="w-2.5 h-2.5" /> At target
                </span>
              )}
            </div>
          </div>
          <div className={`px-2 py-1 rounded-lg ${config.bg} ${config.text} border ${config.border}`}>
            <span className="text-xs font-bold">{product.deal_quality}</span>
          </div>
        </div>
      </button>

      {showHistory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 pb-4"
        >
          {/* Price chart */}
          <div className="h-32 -ml-4 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }}
                  formatter={v => [`$${v}`, 'Price']}
                />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction */}
          <div className="rounded-xl bg-secondary p-3 mb-2">
            <div className="flex items-start gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground/80 leading-relaxed">{product.price_prediction}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Historical low: {formatCurrency(product.historical_low)}</span>
            <span className="text-muted-foreground">Your target: {formatCurrency(product.target_price)}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}