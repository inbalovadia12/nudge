import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePremiumStatus } from '@/lib/usePremium';
import { spendCredits } from '@/lib/useCredits';
import { base44 } from '@/api/base44Client';
import CreditBadge from '@/components/CreditBadge';
import PaywallCard from '@/components/PaywallCard';
import { ArrowLeft, Search, Loader2, Sparkles, TrendingDown, Store, Tag, AlertTriangle, ExternalLink, RotateCcw, ShoppingCart, MapPin, Check, Crosshair } from 'lucide-react';

const SUGGESTIONS = [
  '27 inch OLED TV',
  'PlayStation 6 controller',
  'Running shoes',
  'Wireless noise-canceling headphones',
  '1kg cabbage',
  'Air fryer',
];

function safeNum(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

const TIMEZONE_TO_COUNTRY = {
  'Asia/Jerusalem': 'Israel',
  'America/New_York': 'United States', 'America/Los_Angeles': 'United States',
  'America/Chicago': 'United States', 'America/Denver': 'United States',
  'America/Phoenix': 'United States', 'America/Anchorage': 'United States',
  'Europe/London': 'United Kingdom', 'Europe/Dublin': 'Ireland',
  'Europe/Paris': 'France', 'Europe/Berlin': 'Germany', 'Europe/Madrid': 'Spain',
  'Europe/Rome': 'Italy', 'Europe/Amsterdam': 'Netherlands', 'Europe/Brussels': 'Belgium',
  'Europe/Vienna': 'Austria', 'Europe/Stockholm': 'Sweden', 'Europe/Oslo': 'Norway',
  'Europe/Copenhagen': 'Denmark', 'Europe/Helsinki': 'Finland', 'Europe/Warsand': 'Poland',
  'Europe/Athens': 'Greece', 'Europe/Lisbon': 'Portugal', 'Europe/Zurich': 'Switzerland',
  'Europe/Prague': 'Czech Republic', 'Europe/Istanbul': 'Turkey',
  'America/Toronto': 'Canada', 'America/Vancouver': 'Canada', 'America/Montreal': 'Canada',
  'Australia/Sydney': 'Australia', 'Australia/Melbourne': 'Australia', 'Australia/Brisbane': 'Australia',
  'Asia/Tokyo': 'Japan', 'Asia/Singapore': 'Singapore', 'Asia/Seoul': 'South Korea',
  'Asia/Kolkata': 'India', 'Asia/Dubai': 'United Arab Emirates', 'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Bangkok': 'Thailand', 'Asia/Hong_Kong': 'Hong Kong', 'Asia/Shanghai': 'China',
  'America/Sao_Paulo': 'Brazil', 'America/Mexico_City': 'Mexico',
  'America/Buenos_Aires': 'Argentina', 'America/Bogota': 'Colombia', 'America/Lima': 'Peru',
  'Pacific/Auckland': 'New Zealand',
};

function detectCountryFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_COUNTRY[tz] || null;
  } catch { return null; }
}

function getAmazonDomain(country) {
  if (!country) return 'amazon.com';
  const c = country.toLowerCase();
  if (c.includes('israel')) return 'amazon.co.il';
  if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain')) return 'amazon.co.uk';
  if (c.includes('germany') || c.includes('deutschland')) return 'amazon.de';
  if (c.includes('france')) return 'amazon.fr';
  if (c.includes('canada')) return 'amazon.ca';
  if (c.includes('australia')) return 'amazon.com.au';
  if (c.includes('spain') || c.includes('españa')) return 'amazon.es';
  if (c.includes('italy') || c.includes('italia')) return 'amazon.it';
  if (c.includes('japan')) return 'amazon.co.jp';
  if (c.includes('india')) return 'amazon.in';
  if (c.includes('mexico')) return 'amazon.com.mx';
  if (c.includes('brazil') || c.includes('brasil')) return 'amazon.com.br';
  if (c.includes('netherlands') || c.includes('nederland')) return 'amazon.nl';
  if (c.includes('saudi')) return 'amazon.sa';
  if (c.includes('emirates') || c.includes('uae')) return 'amazon.ae';
  if (c.includes('turkey') || c.includes('türkiye')) return 'amazon.com.tr';
  if (c.includes('singapore')) return 'amazon.sg';
  return 'amazon.com';
}

function getStoreSearchUrl(store, productName, country) {
  const s = (store || '').toLowerCase();
  const q = encodeURIComponent(productName || '');
  const amz = getAmazonDomain(country);

  if (s.includes('amazon')) return `https://www.${amz}/s?k=${q}`;
  if (s.includes('walmart')) return `https://www.walmart.com/search?q=${q}`;
  if (s.includes('best buy') || s.includes('bestbuy')) return `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`;
  if (s.includes('target')) return `https://www.target.com/s?searchTerm=${q}`;
  if (s.includes('ebay')) return `https://www.ebay.com/sch/i.html?_nkw=${q}`;
  if (s.includes('newegg')) return `https://www.newegg.com/p/pl?d=${q}`;
  if (s.includes('costco')) return `https://www.costco.com/CatalogSearch?dept=All&keyword=${q}`;
  if (s.includes('argos')) return `https://www.argos.co.uk/search/${q}/`;
  if (s.includes('currys')) return `https://www.currys.co.uk/search?q=${q}`;
  if (s.includes('john lewis')) return `https://www.johnlewis.com/search?search-term=${q}`;
  if (s.includes('kaufland')) return `https://www.kaufland.de/search?search_input=${q}`;
  if (s.includes('otto') && !s.includes('ottolenghi')) return `https://www.otto.de/suche/${q}/`;
  if (s.includes('media markt')) return `https://www.mediamarkt.de/de/search.html?query=${q}`;
  if (s.includes('cdiscount')) return `https://www.cdiscount.com/s/0/${q}.html`;
  if (s.includes('fnac')) return `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${q}`;
  if (s.includes('alza')) return `https://www.alza.co.uk/search.htm?exps=${q}`;
  if (s.includes('aliexpress')) return `https://www.aliexpress.com/wholesale?SearchText=${q}`;
  if (s.includes('etsy')) return `https://www.etsy.com/search?q=${q}`;
  if (s.includes('ikea')) return `https://www.ikea.com/search/?q=${q}`;
  if (s.includes('b&h') || s.includes('bh photo')) return `https://www.bhphotovideo.com/c/search?Ntt=${q}`;
  if (s.includes('adorama')) return `https://www.adorama.com/searchsite?searchterm=${q}`;

  // Unknown store — Google Shopping search for that store + product
  return `https://www.google.com/search?q=${encodeURIComponent(store + ' ' + (productName || ''))}&tbm=shop`;
}

export default function DealFinder() {
  const { isPremium, loading } = usePremiumStatus();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [creditRefreshKey, setCreditRefreshKey] = useState(0);
  const [profile, setProfile] = useState(null);
  const [country, setCountry] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState('');
  const userCountry = (country.trim() || profile?.country || '').trim();

  useEffect(() => {
    base44.entities.UserProfile.list().then(profiles => {
      const p = profiles[0];
      setProfile(p);
      if (p?.country) {
        setCountry(p.country);
      } else {
        // Auto-detect via IP if no saved location
        detectLocationIP();
      }
    }).catch(() => {
      detectLocationIP();
    });
  }, []);

  const saveCountry = async () => {
    if (!profile || !country.trim()) return;
    try {
      await base44.entities.UserProfile.update(profile.id, { country: country.trim() });
      setProfile({ ...profile, country: country.trim() });
      setEditingLocation(false);
    } catch {}
  };

  const saveLocation = async (locationStr) => {
    setCountry(locationStr);
    if (profile) {
      try {
        await base44.entities.UserProfile.update(profile.id, { country: locationStr });
        setProfile({ ...profile, country: locationStr });
      } catch {}
    }
  };

  const detectLocationGPS = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported — using IP location instead');
      detectLocationIP();
      return;
    }
    setDetecting(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const parts = [data.city || data.locality, data.countryName].filter(Boolean);
          const locationStr = parts.join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          await saveLocation(locationStr);
        } catch {
          await saveLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        // Fall back to IP-based geolocation when GPS is denied or fails
        detectLocationIP();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const detectLocationIP = async () => {
    setDetecting(true);
    setLocationError('');

    // Try IP geolocation first
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data.success !== false) {
        const parts = [data.city, data.country].filter(Boolean);
        const locationStr = parts.join(', ') || data.country_code;
        if (locationStr) { await saveLocation(locationStr); setDetecting(false); return; }
      }
    } catch {}

    // Fallback: use browser timezone to determine country (very reliable)
    const tzCountry = detectCountryFromTimezone();
    if (tzCountry) {
      await saveLocation(tzCountry);
      setDetecting(false);
      return;
    }

    // Last resort: second IP service
    try {
      const res2 = await fetch('https://freeipapi.com/api/json');
      const data2 = await res2.json();
      const parts = [data2.cityName, data2.countryName].filter(Boolean);
      if (parts.length) {
        await saveLocation(parts.join(', '));
        setDetecting(false);
        return;
      }
    } catch {}

    setLocationError('Could not auto-detect location. Please enter it manually.');
    setDetecting(false);
  };

  const search = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q || searching) return;
    if (!isPremium) return;

    const loc = userCountry;

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
      const locationContext = loc
        ? `The user is located in ${loc}. Only return deals from retailers that SHIP to ${loc}. Prioritize local stores based in ${loc} and the local Amazon site. All prices in the local currency of ${loc}.`
        : 'The user has not specified their location. Find online deals from major US retailers. Prices in USD.';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Thryve's AI Deal Finder. The user wants to buy: "${q}"

${locationContext}

Search the web for this exact product (or the closest match). Find at least 3-4 real retailers selling it with current prices.

CRITICAL RULES:
1. Only return REAL products from REAL stores with REAL prices you found in your web search.
2. Every store name must be an actual retailer (e.g. "Amazon", "Walmart", "Best Buy", "Target", "Argos", "MediaMarkt") — never invent store names.
3. DO NOT include any URL field. We will generate search links from the store name automatically. Just return the store name.
4. If you cannot find the exact product, return the closest matching product you actually found.
5. If you genuinely cannot find any results, set best_option to null and explain in the summary.
6. Prices must reflect what you actually found — do not estimate or guess.
7. All prices must be numbers (no currency symbols in the price field).

Return JSON with this exact structure:
- best_option: { product_name (string), price (number), store (string), in_stock (boolean) } — the cheapest real deal you found, or null
- market_average_price (number): average price across the retailers you found
- estimated_savings (number): market_average_price minus best_option price (0 if no best_option)
- is_overpriced (boolean): true if the best price is above market average
- alternatives (array): 2-3 other real deals you found, each { product_name, price, store }
- price_prediction: { trend: "rising"|"falling"|"stable", recommendation (string) } — based on seasonality, sales events, or price history
- price_confidence_score (number 0-100): how confident you are these are current, accurate prices
- is_grocery (boolean): true if this is a grocery/produce item
- currency (string): the currency code (e.g. "USD", "GBP", "EUR", "ILS")
- summary (string): 2-3 sentence summary of what you found and your recommendation.`,
        add_context_from_internet: true,
        model: 'gemini_3_1_pro',
        response_json_schema: {
          type: 'object',
          properties: {
            best_option: {
              type: ['object', 'null'],
              properties: {
                product_name: { type: 'string' },
                price: { type: 'number' },
                store: { type: 'string' },
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
            currency: { type: 'string' },
            summary: { type: 'string' },
          },
        },
      });

      // Normalize numeric fields
      if (response) {
        if (response.market_average_price != null) response.market_average_price = safeNum(response.market_average_price);
        if (response.estimated_savings != null) response.estimated_savings = safeNum(response.estimated_savings);
        if (response.price_confidence_score != null) response.price_confidence_score = safeNum(response.price_confidence_score);
        if (response.best_option) {
          response.best_option.price = safeNum(response.best_option.price);
        }
        if (response.alternatives) {
          response.alternatives = response.alternatives.map(a => ({ ...a, price: safeNum(a.price) }));
        }
      }

      setResults(response);
    } catch (err) {
      console.error('Deal finder error:', err);
      setError("I couldn't complete the search right now. Please try again.");
    }
    setSearching(false);
  };

  const fmtPrice = (amount) => {
    const currency = results?.currency || 'USD';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
    } catch {
      return `$${(amount || 0).toFixed(2)}`;
    }
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
          <p className="text-sm text-muted-foreground">Find the best deals across retailers with AI-powered web search.</p>
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
      <p className="text-sm text-muted-foreground mb-4">Find the best deals across retailers — powered by AI web search.</p>

      {/* Location bar */}
      <div className="mb-4 rounded-2xl border border-border bg-card px-4 py-2.5 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
        {editingLocation ? (
          <>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCountry()}
              placeholder="e.g. United States, UK, Israel"
              autoFocus
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-0"
            />
            <button onClick={saveCountry} disabled={!country.trim()}
              className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-foreground flex-1 truncate">
              {detecting ? 'Detecting your location...' : (country || profile?.country || 'Set your location for local deals')}
            </span>
            <button onClick={detectLocationGPS} disabled={detecting}
              className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors flex-shrink-0 disabled:opacity-50"
              title="Use my location">
              {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { setCountry(country || profile?.country || ''); setEditingLocation(true); }}
              className="text-xs text-primary hover:underline flex-shrink-0">
              {country || profile?.country ? 'Change' : 'Set'}
            </button>
          </>
        )}
      </div>
      {locationError && <p className="text-xs text-danger mb-2 -mt-2">{locationError}</p>}

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
          <p className="text-sm text-muted-foreground">Searching the web for the best deals{country ? ` in ${country}` : ''}...</p>
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
            {results.best_option ? (
              <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Best Deal Found</span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{results.best_option.product_name}</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-2xl font-bold text-primary">{fmtPrice(results.best_option.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Store className="w-4 h-4" />
                    {results.best_option.store}
                  </div>
                  {results.best_option.in_stock === false && (
                    <span className="text-[10px] font-bold bg-danger/10 text-danger px-2 py-1 rounded-full">OUT OF STOCK</span>
                  )}
                </div>
                {results.best_option.store && (
                  <a href={getStoreSearchUrl(results.best_option.store, results.best_option.product_name, userCountry)} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    View on {results.best_option.store} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-warning/30 bg-warning/5 p-5 text-center">
                <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
                <p className="text-sm text-foreground">No exact match found. Check the alternatives below or try a more specific search term.</p>
              </div>
            )}

            {/* Price metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border bg-card p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Market avg</p>
                <p className="text-sm font-bold text-foreground mt-1">{fmtPrice(results.market_average_price)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">You save</p>
                <p className="text-sm font-bold text-success mt-1">{fmtPrice(results.estimated_savings)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Confidence</p>
                <p className="text-sm font-bold text-foreground mt-1">{Math.round(results.price_confidence_score)}%
                  <span className="block w-full h-1 bg-surface-3 rounded-full mt-1.5 overflow-hidden">
                    <span className="block h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.max(0, results.price_confidence_score))}%` }} />
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
                <h3 className="text-sm font-semibold mb-3">Other deals found</h3>
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
                        <span className="text-sm font-bold text-success">{fmtPrice(alt.price)}</span>
                        {alt.store && (
                          <a href={getStoreSearchUrl(alt.store, alt.product_name, userCountry)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
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