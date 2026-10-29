import React, { useState } from 'react';
import { CelebrationIdea, CelebrationPlan } from '../types/plan';
import { Bookmark, BookmarkCheck, Sparkles, Tag, Lightbulb, RefreshCw } from 'lucide-react';

interface IdeasViewProps {
  ideas: CelebrationIdea[];
  plan: CelebrationPlan;
  onAddIdeas: (newIdeas: CelebrationIdea[]) => void;
}

export const IdeasView: React.FC<IdeasViewProps> = ({ ideas, plan, onAddIdeas }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [activeTag, setActiveTag] = useState<string>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const toggleSave = (id: string) => {
    const next = new Set(savedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSavedIds(next);
  };

  const tags = Array.from(new Set(ideas.map((i) => i.tag)));

  const filteredIdeas = ideas.filter((i) => {
    if (activeTag === 'saved') return savedIds.has(i.id);
    if (activeTag === 'all') return true;
    return i.tag === activeTag;
  });

  // Generates 3 new creative ideas ensuring no title collisions
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      const existingTitles = new Set(ideas.map((i) => i.title.toLowerCase()));

      const ideaPool = [
        {
          title: `Artisanal Chai & Kahwa Bar by ${plan.city} Tea Masters`,
          tag: 'Culinary Delight',
          description: `Freshly brewed Kashmiri Kahwa and masala cutting chai served in earthen kulhads with roasted pistachio snacks.`,
        },
        {
          title: `Custom Live Sketch Artist for Guest Portraits`,
          tag: 'Memory Keeper',
          description: `A 3-minute charcoal caricature station providing every guest an instant framed keepsake to take home.`,
        },
        {
          title: `Interactive LED Wristbands Synchronized to Beats`,
          tag: 'Crowd Energy',
          description: `Wearable RF wristbands that illuminate in sync with the DJ bass drops during the high-energy dance session.`,
        },
        {
          title: `Mid-Evening Fireworks / Cold Spark Fountain Salute`,
          tag: 'Highlight Moment',
          description: `Indoor-safe pyrotechnic cold sparks creating a dramatic stage canopy for the celebrant entrance.`,
        },
        {
          title: `Scent Bar: Bespoke Ittar / Perfume Mixing Booth`,
          tag: 'Aesthetic Decor',
          description: `Guests blend custom miniature oud, jasmine, or sandalwood perfumes sealed in antique roll-on vials.`,
        },
        {
          title: `Midnight Street Snack Cart Surprise`,
          tag: 'Night Surprise',
          description: `A surprise midnight arrival of local street-food carts serving hot pav bhaji, rolls, or churros to dance floor survivors.`,
        },
      ];

      const freshOnes = ideaPool
        .filter((cand) => !existingTitles.has(cand.title.toLowerCase()))
        .slice(0, 3)
        .map((cand, idx) => ({
          id: `more_idea_${Date.now()}_${idx}`,
          title: cand.title,
          tag: cand.tag,
          description: cand.description,
        }));

      if (freshOnes.length > 0) {
        onAddIdeas(freshOnes);
      }
      setIsLoadingMore(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono-code flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#0066ff]" />
            Personalised Concepts &middot; {plan.city}
          </h3>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Curated ideas calibrated to your vibe notes ({plan.vibeNotes || 'Celebration'}).
          </p>
        </div>

        <button
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="flex items-center gap-1.5 rounded-sm bg-[#0066ff] px-3.5 py-1.5 text-xs font-mono-code uppercase text-white hover:bg-[#0055d4] transition-all shadow-[0_0_15px_rgba(0,102,255,0.4)] cursor-pointer disabled:opacity-50"
        >
          {isLoadingMore ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isLoadingMore ? 'Curating...' : 'More Ideas'}</span>
        </button>
      </div>

      {/* Tags Filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTag('all')}
          className={`px-2.5 py-1 text-[11px] font-mono-code uppercase rounded-xs transition-colors cursor-pointer ${
            activeTag === 'all'
              ? 'bg-white text-black font-semibold'
              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
          }`}
        >
          All ({ideas.length})
        </button>

        <button
          onClick={() => setActiveTag('saved')}
          className={`px-2.5 py-1 text-[11px] font-mono-code uppercase rounded-xs transition-colors cursor-pointer ${
            activeTag === 'saved'
              ? 'bg-[#0066ff] text-white font-semibold'
              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
          }`}
        >
          Saved ({savedIds.size})
        </button>

        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-2.5 py-1 text-[11px] font-mono-code uppercase rounded-xs transition-colors cursor-pointer ${
              activeTag === tag
                ? 'bg-white text-black font-semibold'
                : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Ideas Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.map((idea) => {
          const isSaved = savedIds.has(idea.id);
          return (
            <div
              key={idea.id}
              className={`group flex flex-col justify-between rounded-sm border p-5 transition-all duration-300 ${
                isSaved
                  ? 'border-[#0066ff]/60 bg-[#0066ff]/5 shadow-[0_0_20px_rgba(0,102,255,0.1)]'
                  : 'border-white/10 bg-[#101014] hover:border-white/25'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <span className="flex items-center gap-1 text-[10px] uppercase font-mono-code text-[#0066ff]">
                    <Tag className="h-3 w-3" />
                    {idea.tag}
                  </span>

                  <button
                    onClick={() => toggleSave(idea.id)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title={isSaved ? 'Remove bookmark' : 'Bookmark idea'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-4 w-4 text-[#0066ff]" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <h4 className="text-base font-semibold text-white group-hover:text-[#3b82f6] transition-colors leading-snug">
                  {idea.title}
                </h4>

                <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed font-light">
                  {idea.description}
                </p>
              </div>

              <div className="mt-5 border-t border-white/5 pt-3 flex items-center justify-between text-[10px] font-mono-code text-zinc-400">
                <span>{isSaved ? 'Bookmarked' : 'AI Inspiration'}</span>
                <span className="text-[#0066ff]">SPEC // READY</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
