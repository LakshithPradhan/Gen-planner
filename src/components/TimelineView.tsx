import React, { useId, useState } from 'react';
import { MAX_TIMELINE_TASKS, TimelineTask } from '../types/plan';
import { scaleTimelineTasks } from '../lib/timeline';
import { getDaysLeft, formatDate } from '../lib/formatters';
import { CheckCircle, Circle, AlertTriangle, Plus, Clock } from 'lucide-react';

interface TimelineViewProps {
  tasks: TimelineTask[];
  targetDate: string;
  onToggleTask: (taskId: string, completed: boolean) => boolean | void;
  onAddTask: (title: string, daysBeforeEvent: number, phase: string, isUrgent: boolean) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  targetDate,
  onToggleTask,
  onAddTask,
}) => {
  const instanceId = useId().replace(/:/g, '');
  const titleInputId = `${instanceId}-timeline-task-title`;
  const daysInputId = `${instanceId}-timeline-task-days`;
  const [filter, setFilter] = useState<'all' | 'pending' | 'urgent' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDays, setNewDays] = useState(14);
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskLimitError, setTaskLimitError] = useState('');
  const [taskEditError, setTaskEditError] = useState('');

  const daysLeft = getDaysLeft(targetDate);
  const scaled = scaleTimelineTasks(tasks, daysLeft, targetDate);

  const filteredTasks = scaled.tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'urgent') return !t.completed && t.isUrgent;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (tasks.length >= MAX_TIMELINE_TASKS) {
      setTaskLimitError(`A plan can contain up to ${MAX_TIMELINE_TASKS} tasks. Remove a task before adding another.`);
      return;
    }
    onAddTask(newTitle.trim(), newDays, 'Custom Milestone', newDays <= 5);
    setNewTitle('');
    setShowAddForm(false);
    setTaskLimitError('');
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    const updated = onToggleTask(taskId, completed);
    setTaskEditError(
      updated === false
        ? 'This task could not be changed because its ID is duplicated or no longer exists.'
        : ''
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Days Left Counter & Completion Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Days Left Card */}
        <div className="rounded-sm border border-white/10 bg-[#121216] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#0066ff]/10 border border-[#0066ff]/40 text-[#0066ff]">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code block">
              Event Countdown
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-mono-code">
                {daysLeft > 0 ? daysLeft : 0}
              </span>
              <span className="text-xs uppercase text-zinc-400 font-mono-code">
                Days Remaining
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-light block">
              Target: {formatDate(targetDate)}
            </span>
          </div>
        </div>

        {/* Task Completion Progress */}
        <div className="rounded-sm border border-white/10 bg-[#121216] p-5 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code block">
                Execution Readiness
              </span>
              <span className="text-base font-semibold text-white font-mono-code">
                {scaled.completedCount} of {scaled.totalCount} Milestones Done ({scaled.percentComplete}%)
              </span>
            </div>

            {scaled.urgentCount > 0 && (
              <span className="flex items-center gap-1 rounded-xs bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] text-red-400 font-mono-code">
                <AlertTriangle className="h-3 w-3" /> {scaled.urgentCount} Urgent
              </span>
            )}
          </div>

          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0066ff] to-[#3b82f6] transition-all duration-500"
              style={{ width: `${scaled.percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Add Task Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-sm border border-white/10">
          {(['all', 'pending', 'urgent', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              aria-pressed={filter === tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-mono-code uppercase rounded-xs transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-[#0066ff] text-white font-medium shadow-[0_0_10px_rgba(0,102,255,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-mono-code uppercase text-zinc-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-[#0066ff]" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Add Task Form Modal / Collapse */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-sm border border-[#0066ff]/40 bg-[#121218] p-4 flex flex-col sm:flex-row gap-3 items-end"
        >
          {taskLimitError && (
            <p role="alert" className="w-full text-xs text-amber-300">
              {taskLimitError}
            </p>
          )}
          <div className="flex-1 w-full">
            <label htmlFor={titleInputId} className="text-[10px] uppercase font-mono-code text-zinc-400 block mb-1">
              Task Description
            </label>
            <input
              id={titleInputId}
              type="text"
              required
              placeholder="e.g. Schedule final audio check with DJ"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xs border border-white/15 bg-black/50 px-3 py-2 text-xs text-white focus:border-[#0066ff] focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-36">
            <label htmlFor={daysInputId} className="text-[10px] uppercase font-mono-code text-zinc-400 block mb-1">
              Days Before Event
            </label>
            <input
              id={daysInputId}
              type="number"
              min="0"
              max="365"
              value={newDays}
              onChange={(e) => setNewDays(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-xs border border-white/15 bg-black/50 px-3 py-2 text-xs text-white font-mono-code focus:border-[#0066ff] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none rounded-xs bg-[#0066ff] px-4 py-2 text-xs font-mono-code uppercase text-white hover:bg-[#0055d4] transition-all cursor-pointer"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xs border border-white/10 px-3 py-2 text-xs font-mono-code uppercase text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Timeline Task List */}
      {taskEditError && (
        <p role="alert" className="text-xs text-amber-300">
          {taskEditError}
        </p>
      )}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono-code text-zinc-400 border border-white/5 rounded-sm">
            No milestones match this filter.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id, !task.completed)}
              className={`group flex items-center justify-between rounded-sm border p-4 transition-all duration-200 cursor-pointer ${
                task.completed
                  ? 'border-white/5 bg-white/[0.02] opacity-60'
                  : task.isUrgent
                  ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500'
                  : 'border-white/10 bg-[#101014] hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
                  className="shrink-0 text-zinc-400 group-hover:text-[#0066ff] transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        task.completed ? 'line-through text-zinc-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.isUrgent && !task.completed && (
                      <span className="shrink-0 rounded-xs bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 text-[9px] uppercase font-mono-code text-amber-300">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono-code text-zinc-400 mt-0.5">
                    <span>Phase: {task.phase || 'Execution'}</span>
                    <span>&middot;</span>
                    <span>Due: {task.dueDate || `${task.daysBeforeEvent}d before event`}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-xs font-mono-code font-semibold text-zinc-300 group-hover:text-white">
                  T -{task.daysBeforeEvent}d
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
