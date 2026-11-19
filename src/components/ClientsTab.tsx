import { useState } from 'react';
import { Pencil, Plus, ReceiptIndianRupee, Trash2 } from 'lucide-react';
import { formatINR } from '../lib/taxEngine';
import type { ClientRecord, IncomeEntry } from '../types';

interface ClientsTabProps {
  clients: ClientRecord[];
  incomes: IncomeEntry[];
  onOpenAdd: () => void;
  onOpenEdit: (client: ClientRecord) => void;
  onLogPayoutForClient: (client: ClientRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

const TAX_SCOPE_LABELS: Record<ClientRecord['taxScope'], string> = {
  domestic_tds: 'Domestic · 10% TDS (194J)',
  domestic_no_tds: 'Domestic · No TDS',
  export_lut: 'Export · 0% GST (LUT)',
};

export function ClientsTab({
  clients,
  incomes,
  onOpenAdd,
  onOpenEdit,
  onLogPayoutForClient,
  onDelete,
}: ClientsTabProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function getClientTotalReceived(clientName: string): number {
    return incomes
      .filter(
        (i) =>
          i.status === 'received' &&
          i.clientName.toLowerCase() === clientName.toLowerCase()
      )
      .reduce((sum, i) => sum + i.grossAmount, 0);
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 font-display">
            Client &amp; Retainer Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Save billing models and TDS/LUT rules per client for 1-click payout logging
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Add Client</span>
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h3 className="text-base font-semibold text-slate-900 font-display">
            No saved clients yet
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Add your retainer or milestone clients to track FYTD revenue per account and prefill tax deductions.
          </p>
          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Client</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => {
            const totalReceived = getClientTotalReceived(client.name);
            return (
              <div
                key={client.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 truncate font-display">
                        {client.name}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span>{client.platform}</span>
                        <span aria-hidden="true">·</span>
                        <span>{client.billingType}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(client)}
                        aria-label={`Edit ${client.name}`}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === client.id ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await onDelete(client.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700 px-1.5 cursor-pointer"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(client.id)}
                          aria-label={`Delete ${client.name}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500">Standard Rate</div>
                      <div className="text-sm font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                        {formatINR(client.retainerAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Received FYTD</div>
                      <div className="text-sm font-mono font-semibold text-emerald-700 tabular-nums mt-0.5">
                        {formatINR(totalReceived)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600">
                    {TAX_SCOPE_LABELS[client.taxScope]}
                  </div>
                  {client.contactNote && (
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {client.contactNote}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onLogPayoutForClient(client)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ReceiptIndianRupee className="w-3.5 h-3.5 shrink-0" />
                  <span>Log Payout for Client</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
