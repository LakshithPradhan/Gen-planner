import React, { useRef } from 'react';
import { DiffDetail } from '../lib/operations';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { Check, RotateCcw, X, GitCompare } from 'lucide-react';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffs: DiffDetail[];
  aiExplanation: string;
  onUndo: () => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  diffs,
  aiExplanation,
  onUndo,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogAccessibility(isOpen, onClose, dialogRef, '#diff-title');

  if (!isOpen) return null;

  return (
    <dialog
      open
      ref={dialogRef}
      className="readable-content fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      aria-modal="true"
      aria-labelledby="diff-title"
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-sm border border-white/15 bg-[#101014] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xs bg-[#0066ff]/20 text-[#0066ff]">
              <GitCompare className="h-4 w-4" />
            </div>
            <div>
              <h3 id="diff-title" tabIndex={-1} className="text-sm font-semibold uppercase font-mono-code text-white">
                Plan Mutation Review (Before vs After)
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono-code">
                Structured AI Operations Executed
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-xs transition-colors cursor-pointer"
            aria-label="Close diff review"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AI Explanation Banner */}
        {aiExplanation && (
          <div className="mb-4 rounded-xs border border-[#0066ff]/30 bg-[#0066ff]/10 p-3 text-xs text-blue-200 font-light leading-relaxed">
            <span className="font-mono-code uppercase font-bold text-[#0066ff] mr-1.5">
              AI ARCHITECT:
            </span>
            {aiExplanation}
          </div>
        )}

        {/* Diffs List */}
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
          {diffs.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono-code text-zinc-400">
              No structural delta detected.
            </div>
          ) : (
            diffs.map((diff, idx) => (
              <div
                key={idx}
                className="rounded-xs border border-white/5 bg-black/50 p-3 text-xs font-mono-code"
              >
                <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                  <span className="font-semibold text-white">{diff.field}</span>
                  <span className="text-[10px] text-[#0066ff]">{diff.description}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                  <div className="text-zinc-400">
                    <span className="text-[9px] uppercase text-zinc-400 block">Previous:</span>
                    <span className="line-through text-red-400/80">{diff.before}</span>
                  </div>
                  <div className="text-white">
                    <span className="text-[9px] uppercase text-[#0066ff] block">Updated:</span>
                    <span className="text-emerald-400 font-medium">{diff.after}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons: Undo vs Accept */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={() => {
              onUndo();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xs border border-red-500/30 bg-red-950/20 px-3.5 py-2 text-xs font-mono-code uppercase text-red-300 hover:bg-red-950/40 hover:border-red-500 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Undo Changes</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xs bg-[#0066ff] px-5 py-2 text-xs font-mono-code uppercase text-white hover:bg-[#0052cc] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,102,255,0.4)]"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Accept Changes</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
