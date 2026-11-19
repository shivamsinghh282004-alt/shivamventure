import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { ClientInput, IncomeInput, WorkflowInput } from '../lib/firestoreService';
import {
  BLUEPRINT_LIMITS,
  PLATFORMS,
  SERVICE_CATEGORIES,
  WORKFLOW_CATEGORIES,
  type ClientBillingType,
  type ClientRecord,
  type ClientTaxScope,
  type IncomeEntry,
  type IncomeStatus,
  type PlatformType,
  type ServiceCategory,
  type WorkflowCategory,
  type WorkflowPriority,
  type WorkflowStatus,
  type WorkflowTask,
} from '../types';

interface IncomeModalProps {
  initialEntry: IncomeEntry | null;
  prefillClient?: ClientRecord | null;
  onClose: () => void;
  onSave: (input: IncomeInput, existingId?: string) => Promise<void>;
}

export function IncomeModal({
  initialEntry,
  prefillClient,
  onClose,
  onSave,
}: IncomeModalProps) {
  const defaultGross =
    initialEntry?.grossAmount ?? (prefillClient ? prefillClient.retainerAmount : 50000);
  const defaultTds =
    initialEntry?.tdsAmount ??
    (prefillClient?.taxScope === 'domestic_tds'
      ? Math.round(defaultGross * 0.1)
      : 0);

  const [clientName, setClientName] = useState(
    initialEntry?.clientName ?? prefillClient?.name ?? ''
  );
  const [platform, setPlatform] = useState<PlatformType>(
    initialEntry?.platform ?? prefillClient?.platform ?? 'Direct UPI / Bank'
  );
  const [category, setCategory] = useState<ServiceCategory>(
    initialEntry?.category ?? 'Development'
  );
  const [grossAmount, setGrossAmount] = useState(String(defaultGross));
  const [tdsAmount, setTdsAmount] = useState(String(defaultTds));
  const [gstAmount, setGstAmount] = useState(String(initialEntry?.gstAmount ?? 0));
  const [status, setStatus] = useState<IncomeStatus>(initialEntry?.status ?? 'received');
  const [receivedDate, setReceivedDate] = useState(
    initialEntry?.receivedDate ?? '2026-11-19'
  );
  const [notes, setNotes] = useState(initialEntry?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const gross = Math.max(1, Number(grossAmount) || 0);
    const tds = Math.min(gross, Math.max(0, Number(tdsAmount) || 0));
    const gst = Math.min(gross, Math.max(0, Number(gstAmount) || 0));

    setSubmitting(true);
    try {
      await onSave(
        {
          clientName,
          platform,
          category,
          grossAmount: gross,
          tdsAmount: tds,
          gstAmount: gst,
          status,
          receivedDate,
          notes,
        },
        initialEntry?.id
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="income-modal-title"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="income-modal-title" className="text-base font-semibold text-slate-900 font-display">
            {initialEntry ? 'Edit Income Entry' : 'Log Client Income'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.maxClientName}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Kaya FinTech"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Channel
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gross Amount (INR)
              </label>
              <input
                type="number"
                required
                min={1}
                max={BLUEPRINT_LIMITS.maxAmount}
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                TDS Deducted (INR)
              </label>
              <input
                type="number"
                min={0}
                max={BLUEPRINT_LIMITS.maxAmount}
                value={tdsAmount}
                onChange={(e) => setTdsAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                GST Collected (INR)
              </label>
              <input
                type="number"
                min={0}
                max={BLUEPRINT_LIMITS.maxAmount}
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Service Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IncomeStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                <option value="received">Received</option>
                <option value="pending">Pending Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Invoice / Milestone Note
            </label>
            <input
              type="text"
              maxLength={BLUEPRINT_LIMITS.maxNotes}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional reference or milestone description"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving...' : initialEntry ? 'Save Changes' : 'Save Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WorkflowModalProps {
  initialTask: WorkflowTask | null;
  onClose: () => void;
  onSave: (input: WorkflowInput, existingId?: string) => Promise<void>;
}

export function WorkflowModal({ initialTask, onClose, onSave }: WorkflowModalProps) {
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [clientName, setClientName] = useState(initialTask?.clientName ?? '');
  const [category, setCategory] = useState<WorkflowCategory>(
    initialTask?.category ?? 'Client Follow-up'
  );
  const [priority, setPriority] = useState<WorkflowPriority>(
    initialTask?.priority ?? 'medium'
  );
  const [status, setStatus] = useState<WorkflowStatus>(initialTask?.status ?? 'todo');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? '2026-12-15');
  const [amountLinked, setAmountLinked] = useState(
    String(initialTask?.amountLinked ?? 0)
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(
        {
          title,
          clientName,
          category,
          priority,
          status,
          dueDate,
          amountLinked: Math.max(0, Number(amountLinked) || 0),
        },
        initialTask?.id
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-modal-title"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="workflow-modal-title" className="text-base font-semibold text-slate-900 font-display">
            {initialTask ? 'Edit Workflow Task' : 'New Workflow Reminder'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.maxTaskTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Send Q3 Advance Tax Challan 280"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Client / Authority
              </label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.maxClientName}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Income Tax India"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WorkflowCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {WORKFLOW_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkflowPriority)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Linked INR
              </label>
              <input
                type="number"
                min={0}
                max={BLUEPRINT_LIMITS.maxAmount}
                value={amountLinked}
                onChange={(e) => setAmountLinked(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {initialTask && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkflowStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ClientModalProps {
  initialClient: ClientRecord | null;
  onClose: () => void;
  onSave: (input: ClientInput, existingId?: string) => Promise<void>;
}

export function ClientModal({ initialClient, onClose, onSave }: ClientModalProps) {
  const [name, setName] = useState(initialClient?.name ?? '');
  const [platform, setPlatform] = useState<PlatformType>(
    initialClient?.platform ?? 'Direct UPI / Bank'
  );
  const [billingType, setBillingType] = useState<ClientBillingType>(
    initialClient?.billingType ?? 'Retainer'
  );
  const [retainerAmount, setRetainerAmount] = useState(
    String(initialClient?.retainerAmount ?? 50000)
  );
  const [taxScope, setTaxScope] = useState<ClientTaxScope>(
    initialClient?.taxScope ?? 'domestic_tds'
  );
  const [contactNote, setContactNote] = useState(initialClient?.contactNote ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(
        {
          name,
          platform,
          billingType,
          retainerAmount: Math.max(0, Number(retainerAmount) || 0),
          taxScope,
          contactNote,
        },
        initialClient?.id
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="client-modal-title" className="text-base font-semibold text-slate-900 font-display">
            {initialClient ? 'Edit Client Profile' : 'Add Client'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Client / Company Name
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.maxClientName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Doon Commerce Labs"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Channel
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Billing Model
              </label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value as ClientBillingType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                <option value="Retainer">Retainer</option>
                <option value="Milestone">Milestone</option>
                <option value="Hourly">Hourly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Standard Rate (INR)
              </label>
              <input
                type="number"
                min={0}
                max={BLUEPRINT_LIMITS.maxAmount}
                value={retainerAmount}
                onChange={(e) => setRetainerAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tax Treatment
              </label>
              <select
                value={taxScope}
                onChange={(e) => setTaxScope(e.target.value as ClientTaxScope)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                <option value="domestic_tds">Domestic (10% TDS)</option>
                <option value="domestic_no_tds">Domestic (No TDS)</option>
                <option value="export_lut">Export (0% LUT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Billing Note
            </label>
            <input
              type="text"
              maxLength={BLUEPRINT_LIMITS.maxContactNote}
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="e.g. Monthly invoice sent on 1st of month"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving...' : initialClient ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
