import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import VerdictCard from '@/components/VerdictCard';
import { getFinancialContext, buildContextString, buildNudgeSystemPrompt } from '@/lib/nudgeUtils';
import { useLogPurchase } from '@/lib/useEntityMutations';
import { Search, Loader2, Mic } from 'lucide-react';

export default function Check() {
  const [input, setInput] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const logPurchase = useLogPurchase();
  const lastVerdictRef = useRef(null);

  const isUrl = input.match(/^https?:\/\//i);

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleCheck = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setVerdict(null);

    try {
      const ctx = await getFinancialContext();
      const contextString = buildContextString(ctx);
      const parsedPrice = parseFloat(price) || 0;
      const productName = input.trim();

      const prompt = buildNudgeSystemPrompt(contextString, {
        extraRules: `The user is considering: "${productName}" for $${parsedPrice}.

Strictness setting: ${ctx.profile.strictness || 'moderate'}

Your job: help them decide if this purchase makes sense. Consider:
- How does this price compare to their remaining balance and monthly income?
- Does this purchase delay their savings goal? By how much?
- Have they spent on similar items recently? Is there a pattern?
- Is the price likely to drop based on the item type?

Choose a verdict tier:
- "green": This fits their goals and spending rhythm.
- "amber": Worth pausing — something to notice.
- "red": This would genuinely set them back.

Provide exactly 3 supporting detail sentences. Be specific with numbers. Each sentence should be short and clear.${isUrl ? `\n\nThe user pasted a URL: ${input}. Use web search to identify the product and its typical price.` : ''}`
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: !!isUrl,
        model: isUrl ? 'gemini_3_flash' : undefined,
        response_json_schema: {
          type: 'object',
          properties: {
            verdict_tier: { type: 'string', enum: ['green', 'amber', 'red'] },
            detail_1: { type: 'string' },
            detail_2: { type: 'string' },
            detail_3: { type: 'string' }
          },
          required: ['verdict_tier', 'detail_1', 'detail_2', 'detail_3']
        }
      });

      const newVerdict = {
        product_name: productName,
        price: parsedPrice,
        verdict_tier: response.verdict_tier,
        detail_1: response.detail_1,
        detail_2: response.detail_2,
        detail_3: response.detail_3,
        action_taken: 'pending',
        input_url: isUrl ? input : null
      };

      const saved = await base44.entities.PurchaseVerdict.create(newVerdict);
      setVerdict({ ...newVerdict, id: saved.id });
    } catch (err) {
      setError('I couldn\'t check that right now. Mind trying again?');
    }
    setLoading(false);
  };

  const handleBuyAnyway = () => {
    if (!verdict) return;
    lastVerdictRef.current = verdict;
    logPurchase.mutate(
      {
        purchase: {
          amount: verdict.price,
          merchant: verdict.product_name,
          category: 'shopping',
          purchase_date: new Date().toISOString().split('T')[0],
          source: 'manual',
          verdict_id: verdict.id,
        },
        verdictId: verdict.id,
      },
      {
        onError: () => {
          setVerdict(lastVerdictRef.current);
        },
      }
    );
    setVerdict(null);
    setInput('');
    setPrice('');
  };

  const handleSaveForLater = async () => {
    if (!verdict) return;
    await base44.entities.SavedItem.create({
      product_name: verdict.product_name,
      url: verdict.input_url || '',
      price_at_save: verdict.price,
      current_price: verdict.price,
      status: 'tracking',
      verdict_tier: verdict.verdict_tier
    });
    await base44.entities.PurchaseVerdict.update(verdict.id, { action_taken: 'saved' });
    setVerdict(null);
    setInput('');
    setPrice('');
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Check a purchase</h1>
        <p className="text-muted-foreground mt-1">Tell me what you're thinking about. I'll give you a quick read.</p>
      </div>

      {!verdict && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-surface-1 border border-border rounded-2xl p-5 space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isUrl && price && handleCheck()}
                placeholder="Paste a URL or type a product name"
                className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-sm"
              />
              <button
                onClick={handleVoice}
                className={`w-12 h-12 rounded-xl border border-border flex items-center justify-center flex-shrink-0 transition-colors ${listening ? 'bg-primary/10 border-primary' : 'bg-surface-2 hover:bg-surface-3'}`}
              >
                <Mic className={`w-5 h-5 ${listening ? 'text-primary' : 'text-muted-foreground'}`} />
              </button>
            </div>
            {!isUrl && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && input && handleCheck()}
                  placeholder="Price"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary text-sm"
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-danger mb-4">{error}</p>}

          <Button
            onClick={handleCheck}
            disabled={loading || !input.trim() || (!isUrl && !price)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 font-medium"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
            ) : (
              <><Search className="w-4 h-4 mr-2" /> Check it</>
            )}
          </Button>
        </motion.div>
      )}

      {verdict && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <VerdictCard
            verdict={verdict}
            onBuyAnyway={handleBuyAnyway}
            onSaveForLater={handleSaveForLater}
          />
          <button
            onClick={() => { setVerdict(null); setInput(''); setPrice(''); }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 py-2"
          >
            Check another purchase
          </button>
        </motion.div>
      )}
    </div>
  );
}