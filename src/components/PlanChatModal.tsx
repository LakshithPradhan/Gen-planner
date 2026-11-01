import React, { useRef, useState } from 'react';
import { CelebrationPlan, ChatResponseSchema, PlanOperation } from '../types/plan';
import { applyOperations, DiffDetail } from '../lib/operations';
import { parseLocalChatRequest } from '../lib/chatFallback';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { Terminal, Send, Sparkles, RotateCcw, X, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  diffs?: DiffDetail[];
  operationsCount?: number;
}

interface PlanChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CelebrationPlan;
  onPlanUpdated: (updatedPlan: CelebrationPlan, diffs: DiffDetail[], aiExplanation: string) => void;
  canUndo: boolean;
  onUndo: () => void;
}

export const PlanChatModal: React.FC<PlanChatModalProps> = ({
  isOpen,
  onClose,
  plan,
  onPlanUpdated,
  canUndo,
  onUndo,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your Evora Planning Assistant. You can give me direct instructions to edit your plan. For example:\n• "Rename event to Summer Celebration"\n• "Cut ₹50,000" or "Add 50 guests"\n• "Rename task Book Venue to Confirm Venue"\n• "Mark venue as booked" or "Add vendor: Bluebird Photo, category: Photography"`,
      timestamp: 'Now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ariaLiveAnnouncement, setAriaLiveAnnouncement] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogAccessibility(isOpen, onClose, dialogRef, '#chat-instruction');

  if (!isOpen) return null;

  const quickPrompts = [
    'Cut ₹50k but keep the live band',
    'Add 50 guests and recalculate split',
    'Mark venue as Booked',
    'Add task: Schedule hair and makeup trial',
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setAriaLiveAnnouncement('Processing plan modification request...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          currentPlan: plan,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error (${response.status})`);
      }

      const parsedResponse = ChatResponseSchema.safeParse(await response.json());
      if (!parsedResponse.success) {
        throw new Error('Chat API returned an invalid response');
      }

      let operations: PlanOperation[] = parsedResponse.data.operations;
      let reply = parsedResponse.data.reply;
      if (operations.length === 0) {
        const localResponse = parseLocalChatRequest(textToSend, plan);
        operations = localResponse.operations;
        reply = localResponse.reply;
      }

      if (operations.length > 0) {
        const { updatedPlan, diffs } = applyOperations(plan, operations);
        if (diffs.length > 0) {
          onPlanUpdated(updatedPlan, diffs, reply);
          setMessages((prev) => [...prev, {
            id: `ai_${Date.now()}`,
            sender: 'assistant',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            diffs,
            operationsCount: operations.length,
          }]);
          setAriaLiveAnnouncement(`Plan updated: ${diffs.length} changes applied. ${reply}`);
        } else {
          const noChangeReply = 'No plan changes were needed or applied.';
          setMessages((prev) => [...prev, {
            id: `ai_${Date.now()}`,
            sender: 'assistant',
            text: noChangeReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          setAriaLiveAnnouncement(noChangeReply);
        }
      } else {
        const assistantMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setAriaLiveAnnouncement(reply);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const localResponse = parseLocalChatRequest(textToSend, plan);
      if (localResponse.operations.length > 0) {
        const { updatedPlan, diffs } = applyOperations(plan, localResponse.operations);
        if (diffs.length > 0) {
          onPlanUpdated(updatedPlan, diffs, localResponse.reply);
          setMessages((prev) => [...prev, {
            id: `local_${Date.now()}`,
            sender: 'assistant',
            text: `Local mode: ${localResponse.reply}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            diffs,
            operationsCount: localResponse.operations.length,
          }]);
          setAriaLiveAnnouncement(`Plan updated locally: ${diffs.length} changes applied. ${localResponse.reply}`);
        } else {
          const noChangeReply = 'No plan changes were needed or applied.';
          setMessages((prev) => [...prev, {
            id: `local_${Date.now()}`,
            sender: 'assistant',
            text: `Local mode: ${noChangeReply}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          setAriaLiveAnnouncement(noChangeReply);
        }
      } else {
        setMessages((prev) => [...prev, {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `Local mode: ${localResponse.reply}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setAriaLiveAnnouncement(localResponse.reply);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog
      open
      ref={dialogRef}
      className="readable-content fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* ARIA Live Region for screen reader accessibility */}
      <div className="sr-only" aria-live="polite">
        {ariaLiveAnnouncement}
      </div>

      <div className="flex h-[90vh] w-full max-w-2xl flex-col rounded-sm border border-white/15 bg-[#0c0c10] shadow-2xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-[#101015]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xs bg-[#0066ff]/20 text-[#0066ff] border border-[#0066ff]/40">
              <Terminal className="h-4 w-4" />
            </span>
            <div>
              <h3 id="chat-modal-title" className="text-sm font-semibold uppercase font-mono-code text-white">
                Conversational Plan Editor
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono-code">
                Target: {plan.eventName} &middot; {plan.currency} {plan.totalBudget.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-1 rounded-xs border border-white/10 px-2.5 py-1 text-[11px] font-mono-code text-zinc-300 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                title="Undo last chat operation"
              >
                <RotateCcw className="h-3 w-3 text-[#0066ff]" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-xs transition-colors cursor-pointer"
              aria-label="Close chat editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono-code uppercase text-zinc-400">
                  {m.sender === 'user' ? 'YOU' : 'AI PLANNER'}
                </span>
                <span className="text-[9px] font-mono-code text-zinc-400">{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-xs p-3.5 text-xs font-light leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-[#0066ff] text-white font-mono-code'
                    : 'bg-[#15151b] border border-white/10 text-zinc-200'
                }`}
              >
                {m.text}

                {/* Inline Diff Summary Badge */}
                {m.diffs && m.diffs.length > 0 && (
                  <div className="mt-3 rounded-xs border border-white/10 bg-black/50 p-2.5 font-mono-code">
                    <span className="text-[10px] uppercase font-bold text-[#3b82f6] block mb-1">
                      Mutations Applied ({m.diffs.length}):
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-300">
                      {m.diffs.map((d, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-1">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>
                            <strong>{d.field}:</strong> {d.before} ➔ {d.after}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono-code text-[#0066ff]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing constraints and executing plan operations...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-white/5 bg-[#0e0e13] px-4 py-2 flex flex-wrap gap-1.5 overflow-x-auto">
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-xs border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono-code text-zinc-300 hover:border-[#0066ff]/50 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-2.5 w-2.5 text-[#0066ff]" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        <p className="border-t border-white/5 bg-[#0e0e13] px-4 py-1 text-xs leading-relaxed text-zinc-300" role="note">
          If configured, your instruction and limited plan details (date, guests, budget, vendor
          names, task titles) may be sent to Anthropic and/or Google Gemini. Avoid personal or sensitive details.
        </p>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t border-white/10 bg-[#101015] p-3 flex items-center gap-2"
        >
          <input
            id="chat-instruction"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type e.g. 'cut ₹50k but keep the band' or 'add 50 guests'..."
            className="flex-1 rounded-xs border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-400 focus:border-[#0066ff] focus:outline-none font-mono-code"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xs bg-[#0066ff] text-white hover:bg-[#0052cc] transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_12px_rgba(0,102,255,0.4)]"
            aria-label="Send instruction"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </dialog>
  );
};
