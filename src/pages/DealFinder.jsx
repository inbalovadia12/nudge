import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePremiumStatus } from '@/lib/usePremium';
import { spendCredits } from '@/lib/useCredits';
import { base44 } from '@/api/base44Client';
import CreditBadge from '@/components/CreditBadge';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Search, Loader2, Sparkles, TrendingDown, Store, Tag, AlertTriangle, ExternalLink, RotateCcw, ShoppingCart } from 'lucide-react';

const SUGGESTIONS = [
  '27 inch OLED TV',
  'PlayStation 6 controller',
  'Running shoes',
  'Wireless noise-canceling headphones',
  '1kg cabbage',
  'Air fryer',
];

export default function DealFinder() {
  const { isPremium, loading } = usePremiumStatus();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [creditRefreshKey, setCreditRefreshKey] = useState(0);

  const search = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q || searching) return;

    if (!isPremium) return;

    setSearching(true);
    setError('');
    setResults(null);
    setQuery(q);

    const spend = await spendCredits('deal_finder_search');
    if (!spend.success) {
      setError("You're out of AI credits or your plan doesn't include the Deal Finder. Upgrade to continue finding deals.");
      setSearching(false);
      setCreditRefreshKey(k => k + 1);
      return;
    }
    setCreditRefreshKey(k => k + 1);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Nudge, a smart deal-finding assistant. The user wants to buy: "${q}"

Search the web for the best available deals on this product. Find real, current prices from real retailers. 

Return your findings as JSON with this structure:
- best_option: { product_name, price, store, url, in_stock (boolean) }
- market_average_price (number): the typical market price for this product
- estimated_savings (number): how much the user saves vs market average
- is_overpriced (boolean): true if the best price seems suspiciously high
- alternatives (array of { product_name, price, store, url }): 2-3 cheaper alternatives or similar products
- price_prediction: { trend ("rising"|"falling"|"stable"), recommendation (string) }
- price_confidence_score (number 0-100): how confident you are in these prices
- is_grocery (boolean): true if this is a grocery/produce item
- summary (string): 1-2 sentence summary of the deal landscape

For groceries/produce, compare prices per kg/unit across stores and suggest cheaper substitutes.
For electronics, check multiple retailers and flag suspiciously overpriced listings.
Be realistic — only return actual products and stores you find. If you can't find the exact item, suggest the closest match.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            best_option: {
              type: 'object',
              properties: {
                product_name: { type: 'string' },
                price: { type: 'number' },
                store: { type: 'string' },
                url: { type: 'string' },
                in_stock: { type: 'boolean' },
              },
            },
            market_average_price: { type: 'number' },
            estimated_savings: { type: 'number' },
            is_overpriced: { type: 'boolean' },
            alternatives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_name: { type: 'string' },
                  price: { type: 'number' },
                  store: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
            price_prediction: {
              type: 'object',
              properties: {
                trend: { type: 'string' },
                recommendation: { type: 'string' },
              },
            },
            price_confidence_score: { type: 'number' },
            is_grocery: { type: 'boolean' },
            summary: { type: 'string' },
          },
        },
      });

      setResults(response);
    } catch {
      setError("I couldn't search for deals right now. Try again in a moment.");
    }
    setSearching(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  if (!isPremium) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
        <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Insights
        </Link>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-heading">AI Deal Finder</h1>
          </div>
          <p className="text-sm text-muted-foreground">Find the best deals across retailers with AI-powered search.</p>
        </div>
        <PaywallCard title="AI Deal Finder" description="Search any product and get the best current deals, price comparisons across retailers, cheaper alternatives, and price predictions — powered by AI web search." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 lg:pb-6">
      <Link to="/insights" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Insights
      </Link>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-heading">AI Deal Finder</h1>
        </div>
        <CreditBadge refreshKey={creditRefreshKey} />
      </div>
      <p className="text-sm text-muted-foreground mb-6">Find the best deals across retailers — powered by AI web search.</p>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-surface-2 border border-border rounded-2xl px-4">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="What are you looking for?"
            disabled={searching}
            className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-0"
          />
        </div>
        <button
          onClick={() => search()}
          disabled={!query.trim() || searching}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          {searching ? <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" /> : <Sparkles className="w-5 h-5 text-primary-foreground" />}
        </button>
      </div>

      {/* Suggestions */}
      {!results && !searching && !error && (
        <div className="flex flex-wrap gap-2 mb-6">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => search(s)} disabled={searching}
              className="text-xs bg-surface-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 rounded-full px-3 py-2 transition-colors disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {searching && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Searching the web for the best deals...</p>
        </motion.div>
      )}

      {/* Error */}
      {error && !searching && (
        <div className="rounded-3xl border border-danger/30 bg-danger/5 p-5 text-center">
          <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-2" />
          <p className="text-sm text-foreground">{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && !searching && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary */}
            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Summary</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{results.summary}</p>
              {results.is_grocery && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-primary">
                  <ShoppingCart className="w-3.5 h-3.5" /> Grocery item — prices compared per unit/kg
                </div>
              )}
            </div>

            {/* Best option */}
            {results.best_option && (
              <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Best Deal Found</span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{results.best_option.product_name}</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">${results.best_option.price?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Store className="w-4 h-4" />
                    {results.best_option.store}
                  </div>
                  {results.best_option.in_stock === false && (
                    <span className="text-[10px] font-bold bg-danger/10 text-danger px-2 py-1 rounded-full">OUT OF STOCK</span>
                  )}
                </div>
                {results.best_option.url && (
                  <a href={results.best_option.url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    View deal <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Price metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border bg-card p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Market avg</p>
                <p className="text-sm font-bold text-foreground mt-1">${results.market_average_price?.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">You save</p>
                <p className="text-sm font-bold text-success mt-1">${results.estimated_savings?.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Confidence</p>
                <p className="text-sm font-bold text-foreground mt-1">{results.price_confidence_score}%
                  <span className="block w-full h-1 bg-surface-3 rounded-full mt-1.5 overflow-hidden">
                    <span className="block h-full bg-primary rounded-full" style={{ width: `${results.price_confidence_score}%` }} />
                  </span>
                </p>
              </div>
            </div>

            {/* Overpriced warning */}
            {results.is_overpriced && (
              <div className="flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/5 p-4">
                <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">This product appears to be <span className="font-bold text-danger">overpriced</span> right now. Consider waiting or checking alternatives below.</p>
              </div>
            )}

            {/* Price prediction */}
            {results.price_prediction && (
              <div className="rounded-3xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className={`w-4 h-4 ${results.price_prediction.trend === 'falling' ? 'text-success' : results.price_prediction.trend === 'rising' ? 'text-danger' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price Prediction</span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full ${results.price_prediction.trend === 'falling' ? 'bg-success/10 text-success' : results.price_prediction.trend === 'rising' ? 'bg-danger/10 text-danger' : 'bg-muted text-muted-foreground'}`}>
                    {results.price_prediction.trend?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{results.price_prediction.recommendation}</p>
              </div>
            )}

            {/* Alternatives */}
            {results.alternatives && results.alternatives.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Cheaper alternatives</h3>
                <div className="space-y-2">
                  {results.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{alt.product_name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Store className="w-3 h-3" /> {alt.store}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-success">${alt.price?.toFixed(2)}</span>
                        {alt.url && (
                          <a href={alt.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search again */}
            <button onClick={() => { setResults(null); setQuery(''); }}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground py-3">
              <RotateCcw className="w-4 h-4" /> Search for another product
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}