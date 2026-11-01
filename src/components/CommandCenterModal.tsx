import React, { useId, useRef, useState } from 'react';
import { EventType, CurrencyCode, GenerationModule, PlanRequestInput } from '../types/plan';
import { GENERATION_MODULES, INFORMATIONAL_MODULES } from '../lib/generationModules';
import { addDaysToDateOnly, getLocalDateOnly } from '../lib/dateOnly';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { Sparkles, Terminal, X, Check, Loader2, ArrowRight } from 'lucide-react';

interface CommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: PlanRequestInput) => Promise<void>;
  isLoading: boolean;
}

interface ArchetypePreset {
  label: string;
  eventName: string;
  guests: number;
  inrBudget: number;
  otherCurrencyBudget: number;
  city: string;
  vibeNotes: string;
}

const ARCHETYPE_PRESET_TYPES = ['wedding', 'birthday', 'community'] as const satisfies readonly EventType[];

const ARCHETYPE_PRESETS: Record<EventType, ArchetypePreset> = {
  wedding: {
    label: '💍 Royal Wedding',
    eventName: 'Ananya & Rohan’s Royal Wedding',
    guests: 350,
    inrBudget: 1800000,
    otherCurrencyBudget: 25000,
    city: 'Jaipur',
    vibeNotes: 'Royal Rajasthani heritage vibe, multi-day Sangeet & Haldi, focus on live kesar sweets and cinematic photo reel',
  },
  birthday: {
    label: '🎂 Milestone Birthday',
    eventName: 'Kabir’s 30th Neon Rooftop Jubilee',
    guests: 45,
    inrBudget: 120000,
    otherCurrencyBudget: 3500,
    city: 'Mumbai',
    vibeNotes: 'Cyberpunk neon lighting, 360 glambot, artisanal gin cocktail counter, midnight surprise DJ set',
  },
  community: {
    label: '🎪 Community Fest',
    eventName: 'Indiranagar Diwali Utsav & Carnival',
    guests: 400,
    inrBudget: 450000,
    otherCurrencyBudget: 8000,
    city: 'Bengaluru',
    vibeNotes: 'Community cultural evening, live stage line-array sound, food stalls, volunteer coordination, zero-waste',
  },
};

interface ArchetypePresetSelectorProps {
  selectedType: EventType;
  onSelect: (type: EventType) => void;
}

const ArchetypePresetSelector: React.FC<ArchetypePresetSelectorProps> = ({
  selectedType,
  onSelect,
}) => (
  <div className="mb-6 rounded-xs border border-white/10 bg-black/40 p-3.5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-mono-code uppercase text-zinc-400">
        QUICK ARCHETYPE PRESETS:
      </span>
      <span className="text-[10px] text-zinc-400 font-mono-code">Autofills baseline fields</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {ARCHETYPE_PRESET_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={selectedType === type}
          onClick={() => onSelect(type)}
          className={`px-3 py-1.5 text-xs font-mono-code uppercase rounded-xs transition-all cursor-pointer ${
            selectedType === type
              ? 'bg-[#0066ff] text-white font-semibold shadow-[0_0_12px_rgba(0,102,255,0.4)]'
              : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          {ARCHETYPE_PRESETS[type].label}
        </button>
      ))}
    </div>
  </div>
);

export const CommandCenterModal: React.FC<CommandCenterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const instanceId = useId().replace(/:/g, '');
  const inputIds = {
    eventName: `${instanceId}-command-event-name`,
    date: `${instanceId}-command-event-date`,
    guests: `${instanceId}-command-guests`,
    currency: `${instanceId}-command-currency`,
    budget: `${instanceId}-command-budget`,
    city: `${instanceId}-command-city`,
    vibeNotes: `${instanceId}-command-vibe-notes`,
  };
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventName, setEventName] = useState('Ananya & Rohan’s Royal Wedding');
  const [date, setDate] = useState(() => addDaysToDateOnly(getLocalDateOnly(), 90));
  const [guests, setGuests] = useState(350);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [totalBudget, setTotalBudget] = useState(1800000);
  const [city, setCity] = useState('Jaipur');
  const [vibeNotes, setVibeNotes] = useState(
    'Royal Rajasthani heritage vibe, multi-day Sangeet & Haldi, focus on live kesar sweets and cinematic photo reel'
  );

  // Selected modules
  const [selectedModules, setSelectedModules] = useState<GenerationModule[]>([...GENERATION_MODULES]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogAccessibility(isOpen, onClose, dialogRef, `#${inputIds.eventName}`);

  if (!isOpen) return null;

  const toggleModule = (mod: GenerationModule) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleApplyPreset = (type: EventType) => {
    const preset = ARCHETYPE_PRESETS[type];
    setEventType(type);
    setEventName(preset.eventName);
    setGuests(preset.guests);
    setTotalBudget(currency === 'INR' ? preset.inrBudget : preset.otherCurrencyBudget);
    setCity(preset.city);
    setVibeNotes(preset.vibeNotes);
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
      selectedModules,
    });
  };

  return (
    <dialog
      open
      ref={dialogRef}
      className="readable-content fixed inset-0 z-50 flex items-start justify-center bg-black/85 p-3 sm:items-center sm:p-6 backdrop-blur-md overflow-y-auto"
      aria-modal="true"
      aria-labelledby={`${instanceId}-command-center-title`}
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative my-0 w-full max-w-3xl rounded-sm border border-white/15 bg-[#0e0e12] p-6 sm:my-8 sm:p-8 shadow-2xl">
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
              <h2 id={`${instanceId}-command-center-title`} className="text-xl font-medium text-white font-serif-display uppercase">
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

        <ArchetypePresetSelector selectedType={eventType} onSelect={handleApplyPreset} />

        {/* Modules Selection Chips */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono-code uppercase text-zinc-400">
              OPTIONAL GENERATED CONTENT:
            </span>
            <span className="text-[11px] font-mono-code text-[#3b82f6]">
              {selectedModules.length === 0
                ? 'No optional content selected'
                : `${selectedModules.length} selected`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GENERATION_MODULES.map((mod) => {
              const isSelected = selectedModules.includes(mod);
              return (
                <button
                  key={mod}
                  type="button"
                  aria-pressed={isSelected}
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
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
            Vendor Directory and City Ideas control which generated sections are included. Budget
            Normalisation, Compressed Timeline, What-If Simulator, and Conversational Chat Editor
            are informational: these core features remain available on every plan.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Always available planning features">
            {INFORMATIONAL_MODULES.map((mod) => (
              <span
                key={mod}
                className="rounded-xs border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-mono-code text-zinc-400"
              >
                {mod} · Always available
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Brief Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={inputIds.eventName} className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Event Name / Title
              </label>
              <input
                id={inputIds.eventName}
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={inputIds.date} className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Target Date
              </label>
              <input
                id={inputIds.date}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={inputIds.guests} className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Guest Headcount
              </label>
              <input
                id={inputIds.guests}
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
                <label htmlFor={inputIds.currency} className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                  Currency
                </label>
                <select
                  id={inputIds.currency}
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
                <label htmlFor={inputIds.budget} className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                  Total Budget ({currency})
                </label>
                <input
                  id={inputIds.budget}
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={inputIds.city} className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Host City / Region
              </label>
              <input
                id={inputIds.city}
                type="text"
                required
                placeholder="e.g. Jaipur, Mumbai, Bengaluru, New Delhi, London"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-[#0066ff] focus:outline-none font-mono-code"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={inputIds.vibeNotes} className="text-[11px] font-mono-code uppercase text-zinc-400 block mb-1">
                Vibe, Rituals &amp; Operational Constraints
              </label>
              <textarea
                id={inputIds.vibeNotes}
                rows={3}
                placeholder="Detail cultural elements (Haldi/Sangeet), dietary choices, noise limits, special entertainment requests..."
                value={vibeNotes}
                onChange={(e) => setVibeNotes(e.target.value)}
                className="w-full rounded-xs border border-white/15 bg-black/60 p-3 text-xs text-white focus:border-[#0066ff] focus:outline-none font-light leading-relaxed"
              />
            </div>
            <p className="sm:col-span-2 text-xs text-zinc-400" role="note">
              Privacy: when AI providers are configured, event type, date, guest count, budget,
              city, and these notes may be sent to Anthropic and/or Google Gemini to generate suggestions.
              Avoid personal, contact, or otherwise sensitive details. Offline generation stays on
              this device.
            </p>
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
    </dialog>
  );
};
