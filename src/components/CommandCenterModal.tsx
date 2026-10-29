import React, { useState } from 'react';
import { EventType, CurrencyCode, PlanRequestInput } from '../types/plan';
import { Sparkles, Terminal, X, Check, Loader2, ArrowRight } from 'lucide-react';

interface CommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: PlanRequestInput) => Promise<void>;
  isLoading: boolean;
}

export const CommandCenterModal: React.FC<CommandCenterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventName, setEventName] = useState('Ananya & Rohan’s Royal Wedding');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(350);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [totalBudget, setTotalBudget] = useState(1800000);
  const [city, setCity] = useState('Jaipur');
  const [vibeNotes, setVibeNotes] = useState(
    'Royal Rajasthani heritage vibe, multi-day Sangeet & Haldi, focus on live kesar sweets and cinematic photo reel'
  );

  // Selected modules
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'Budget Normalisation',
    'Compressed Timeline',
    'Vendor Directory',
    'City Ideas',
  ]);

  if (!isOpen) return null;

  const availableModules = [
    'Budget Normalisation',
    'Compressed Timeline',
    'Vendor Directory',
    'City Ideas',
    'What-If Simulator',
    'Conversational Chat Editor',
  ];

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleApplyPreset = (type: EventType) => {
    setEventType(type);
    if (type === 'wedding') {
      setEventName('Ananya & Rohan’s Royal Wedding');
      setGuests(350);
      setTotalBudget(currency === 'INR' ? 1800000 : 25000);
      setCity('Jaipur');
      setVibeNotes('Royal Rajasthani heritage vibe, multi-day Sangeet & Haldi, focus on live kesar sweets and cinematic photo reel');
    } else if (type === 'birthday') {
      setEventName('Kabir’s 30th Neon Rooftop Jubilee');
      setGuests(45);
      setTotalBudget(currency === 'INR' ? 120000 : 3500);
      setCity('Mumbai');
      setVibeNotes('Cyberpunk neon lighting, 360 glambot, artisanal gin cocktail counter, midnight surprise DJ set');
    } else {
      setEventName('Indiranagar Diwali Utsav & Carnival');
      setGuests(400);
      setTotalBudget(currency === 'INR' ? 450000 : 8000);
      setCity('Bengaluru');
      setVibeNotes('Community cultural evening, live stage line-array sound, food stalls, volunteer coordination, zero-waste');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      eventType,
      eventName,
      date,
      guests,
      currency,
      totalBudget,
      city,
      vibeNotes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-center-title"
    >
      <div className="relative my-8 w-full max-w-3xl rounded-sm border border-white/15 bg-[#0e0e12] p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xs bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/40">
              <Terminal className="h-4 w-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono-code tracking-widest text-[#0066ff] block">
                COMMAND CENTER // ARCHITECTURAL BRIEF
              </span>
              <h2 id="command-center-title" className="text-xl font-medium text-white font-serif-display uppercase">
                Initiate Celebration Plan
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-xs transition-colors cursor-pointer"
            aria-label="Close command center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Selector Chips */}
        <div className="mb-6 rounded-xs border border-white/10 bg-black/40 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono-code uppercase text-zinc-400">
              QUICK ARCHETYPE PRESETS:
            </span>
            <span className="text-[10px] text-zinc-400 font-mono-code">Autofills baseline fields</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['wedding', 'birthday', 'community'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleApplyPreset(type)}
                className={`px-3 py-1.5 text-xs font-mono-code uppercase rounded-xs transition-all cursor-pointer ${
                  eventType === type
                    ? 'bg-[#0066ff] text-white font-semibold shadow-[0_0_12px_rgba(0,102,255,0.4)]'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {type === 'wedding' && '💍 Royal Wedding'}
                {type === 'birthday' && '🎂 Milestone Birthday'}
                {type === 'community' && '🎪 Community Fest'}
              </button>
            ))}
          </div>
        </div>

        {/* Modules Selection Chips */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono-code uppercase text-zinc-400">
              ENGAGED PLANNING MODULES:
            </span>
            <span className="text-[11px] font-mono-code text-[#3b82f6]">
              {selectedModules.length === 0
                ? 'Modules: [none selected]'
                : `Modules: ${selectedModules.length} selected (${selectedModules.slice(0, 2).join(', ')}${
                    selectedModules.length > 2 ? '...' : ''
                  })`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableModules.map((mod) => {
              const isSelected = selectedModules.includes(mod);
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => toggleModule(mod)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono-code rounded-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0066ff]/20 border border-[#0066ff] text-white'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Check
                    className={`h-3 w-3 ${isSelected ? 'text-[#0066ff]' : 'text-transparent'}`}
                  />
                  <span>{mod}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Brief Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Event Name / Title
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Target Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Guest Headcount
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full rounded-xs border border-white/15 bg-[#14141a] px-2 py-2 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                  Total Budget ({currency})
                </label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Host City / Region
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jaipur, Mumbai, Bengaluru, New Delhi, London"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-[#0066ff] focus:outline-none font-mono-code"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Vibe, Rituals &amp; Operational Constraints
              </label>
              <textarea
                rows={3}
                placeholder="Detail cultural elements (Haldi/Sangeet), dietary choices, noise limits, special entertainment requests..."
                value={vibeNotes}
                onChange={(e) => setVibeNotes(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 p-3 text-xs text-white focus:border-[#0066ff] focus:outline-none font-light leading-relaxed"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs font-mono-code uppercase text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xs bg-[#0066ff] px-6 py-2.5 text-xs font-mono-code uppercase font-semibold text-white hover:bg-[#0055d4] transition-all shadow-[0_0_20px_rgba(0,102,255,0.4)] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Formulate Celebration Plan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
