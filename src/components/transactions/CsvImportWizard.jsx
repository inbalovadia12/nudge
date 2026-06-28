import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { parseCSV, autoMapColumns, SYSTEM_FIELDS } from '@/lib/csvUtils';
import { Upload, FileText, ArrowRight, ArrowLeft, Check, Loader2, Wand2, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function CsvImportWizard({ tier, onComplete }) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const canAutoMap = tier === 'plus' || tier === 'pro';

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target.result);
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError('Could not parse this CSV file. Please check the format.');
          return;
        }
        setHeaders(parsed.headers);
        setRows(parsed.rows);
        const initial = {};
        parsed.headers.forEach(h => { initial[h] = 'ignore'; });
        if (canAutoMap) {
          const suggested = autoMapColumns(parsed.headers);
          Object.assign(initial, suggested);
        }
        setMapping(initial);
        setStep(2);
      } catch {
        setError('Failed to read the file. Please try again.');
      }
    };
    reader.readAsText(file);
  };

  const handleAutoMap = () => {
    const suggested = autoMapColumns(headers);
    const newMapping = { ...mapping };
    headers.forEach(h => {
      if (suggested[h]) newMapping[h] = suggested[h];
    });
    setMapping(newMapping);
  };

  const mappedPreview = rows.slice(0, 5).map(row => {
    const mapped = {};
    Object.entries(mapping).forEach(([col, field]) => {
      if (field !== 'ignore' && row[col] !== undefined) mapped[field] = row[col];
    });
    return mapped;
  });

  const hasRequired = Object.values(mapping).includes('date') &&
    Object.values(mapping).includes('description') &&
    Object.values(mapping).includes('amount');

  const handleSubmit = async () => {
    setProcessing(true);
    setError(null);
    try {
      const transactions = rows.map(row => {
        const mapped = {};
        Object.entries(mapping).forEach(([col, field]) => {
          if (field !== 'ignore' && row[col] !== undefined) mapped[field] = row[col];
        });
        return mapped;
      }).filter(t => t.date && t.description && t.amount);

      const res = await base44.functions.invoke('csv-import', {
        action: 'process_csv',
        transactions,
      });
      setResult(res.data);
      setStep(4);
    } catch (err) {
      setError('Failed to import transactions. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const steps = ['Upload', 'Map Columns', 'Preview', 'Done'];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              step > i + 1 ? 'bg-success text-success-foreground' :
              step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`ml-1.5 text-xs ${step === i + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Click to upload a CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">Bank export or transaction statement (.csv)</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            {error && (
              <p className="text-xs text-danger mt-3 text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </motion.div>
        )}

        {/* Step 2: Map Columns */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">{fileName}</p>
              </div>
              {canAutoMap ? (
                <button
                  onClick={handleAutoMap}
                  className="flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Auto-map
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground/50">Auto-map available on Basic+</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Match your CSV columns to the system fields below.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {headers.map(h => (
                <div key={h} className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-2">
                  <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{h}</span>
                  <select
                    value={mapping[h] || 'ignore'}
                    onChange={e => setMapping({ ...mapping, [h]: e.target.value })}
                    className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50"
                  >
                    {SYSTEM_FIELDS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {!hasRequired && (
              <p className="text-xs text-warning mt-3 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Date, Description, and Amount are required.
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!hasRequired}
                className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs text-muted-foreground mb-3">
              Review the first {Math.min(5, rows.length)} rows. {rows.length} total transactions will be imported.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {mappedPreview.map((row, i) => (
                <div key={i} className="bg-surface-2 rounded-xl p-2.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-mono text-foreground">{row.date || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="text-foreground truncate ml-2 max-w-[60%] text-right">{row.description || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono text-foreground">{row.amount || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {processing ? 'Importing...' : `Import ${rows.length} transactions`}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Result */}
        {step === 4 && result && (
          <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-success" />
            </div>
            <p className="text-sm font-bold text-foreground">Import complete!</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-surface-2 rounded-xl p-3">
                <p className="text-lg font-bold text-success">{result.created_count}</p>
                <p className="text-[10px] text-muted-foreground">Imported</p>
              </div>
              <div className="bg-surface-2 rounded-xl p-3">
                <p className="text-lg font-bold text-muted-foreground">{result.duplicate_count}</p>
                <p className="text-[10px] text-muted-foreground">Duplicates</p>
              </div>
              <div className="bg-surface-2 rounded-xl p-3">
                <p className="text-lg font-bold text-warning">{result.invalid_count || 0}</p>
                <p className="text-[10px] text-muted-foreground">Skipped</p>
              </div>
            </div>
            <button
              onClick={() => { reset(); if (onComplete) onComplete(); }}
              className="w-full mt-4 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}