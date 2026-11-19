import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatINR } from '../lib/taxEngine';
import {
  WORKFLOW_CATEGORIES,
  type WorkflowCategory,
  type WorkflowStatus,
  type WorkflowTask,
} from '../types';

interface WorkflowsTabProps {
  workflows: WorkflowTask[];
  onOpenAdd: () => void;
  onOpenEdit: (task: WorkflowTask) => void;
  onUpdateStatus: (id: string, status: WorkflowStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function WorkflowsTab({
  workflows,
  onOpenAdd,
  onOpenEdit,
  onUpdateStatus,
  onDelete,
}: WorkflowsTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | WorkflowStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | WorkflowCategory>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return workflows.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [workflows, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    return {
      all: workflows.length,
      todo: workflows.filter((t) => t.status === 'todo').length,
      in_progress: workflows.filter((t) => t.status === 'in_progress').length,
      completed: workflows.filter((t) => t.status === 'completed').length,
    };
  }, [workflows]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: `All (${counts.all})` },
                { id: 'todo', label: `To Do (${counts.todo})` },
                { id: 'in_progress', label: `In Progress (${counts.in_progress})` },
                { id: 'completed', label: `Completed (${counts.completed})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by workflow category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | WorkflowCategory)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {WORKFLOW_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start lg:self-auto"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>New Workflow Task</span>
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-base font-semibold text-slate-900 font-display">
              {workflows.length === 0 ? 'No workflow tasks created yet' : 'No tasks match this filter'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Track advance tax filings, invoice follow-ups, and client deliverables in one ordered queue.
            </p>
            {workflows.length === 0 && (
              <button
                type="button"
                onClick={onOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Task</span>
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {filtered.map((task) => {
              const priorityTextColor =
                task.priority === 'high'
                  ? 'text-red-700'
                  : task.priority === 'medium'
                    ? 'text-amber-700'
                    : 'text-slate-500';

              return (
                <li
                  key={task.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStatus(
                          task.id,
                          task.status === 'completed' ? 'todo' : 'completed'
                        )
                      }
                      aria-label={`Toggle completion for ${task.title}`}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : task.status === 'in_progress' ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          task.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {task.clientName && (
                          <>
                            <span className="text-slate-700">{task.clientName}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-medium capitalize ${priorityTextColor}`}>
                          {task.priority} priority
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">Due {task.dueDate}</span>
                        {task.amountLinked > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-800">
                              {formatINR(task.amountLinked)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <select
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      onChange={(e) =>
                        onUpdateStatus(task.id, e.target.value as WorkflowStatus)
                      }
                      className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    {confirmDeleteId === task.id ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDelete(task.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(task)}
                          aria-label={`Edit ${task.title}`}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(task.id)}
                          aria-label={`Delete ${task.title}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
