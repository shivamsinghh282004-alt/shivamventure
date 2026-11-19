import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { formatINR } from '../lib/taxEngine';
import { PLATFORMS, type IncomeEntry, type IncomeStatus, type PlatformType } from '../types';

interface IncomeLedgerTabProps {
  incomes: IncomeEntry[];
  onOpenAdd: () => void;
  onOpenEdit: (entry: IncomeEntry) => void;
  onToggleStatus: (id: string, nextStatus: IncomeStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function IncomeLedgerTab({
  incomes,
  onOpenAdd,
  onOpenEdit,
  onToggleStatus,
  onDelete,
}: IncomeLedgerTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IncomeStatus>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformType>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const queryLower = searchTerm.trim().toLowerCase();
    return incomes.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
      if (queryLower) {
        const hay = `${item.clientName} ${item.platform} ${item.category} ${item.notes}`.toLowerCase();
        if (!hay.includes(queryLower)) return false;
      }
      return true;
    });
  }, [incomes, searchTerm, statusFilter, platformFilter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        acc.gross += item.grossAmount;
        acc.tds += item.tdsAmount;
        acc.gst += item.gstAmount;
        acc.net += Math.max(0, item.grossAmount - item.tdsAmount);
        return acc;
      },
      { gross: 0, tds: 0, gst: 0, net: 0 }
    );
  }, [filtered]);

  function handleExportCsv() {
    const header = [
      'Date',
      'Client',
      'Platform',
      'Category',
      'Gross INR',
      'TDS INR',
      'GST INR',
      'Net Received INR',
      'Status',
      'Notes',
    ];
    const rows = filtered.map((i) => [
      i.receivedDate,
      `"${i.clientName.replace(/"/g, '""')}"`,
      `"${i.platform}"`,
      `"${i.category}"`,
      String(i.grossAmount),
      String(i.tdsAmount),
      String(i.gstAmount),
      String(Math.max(0, i.grossAmount - i.tdsAmount)),
      i.status,
      `"${i.notes.replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'shivamventure-income-ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[210px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search client, platform, or note..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'received', 'pending'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 capitalize ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by platform"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as 'all' | PlatformType)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="all">All Platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Log Income</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-base font-semibold text-slate-900 font-display">
              {incomes.length === 0 ? 'No income entries logged yet' : 'No matching entries'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              {incomes.length === 0
                ? 'Record payouts from Indian or international clients to track net cash, TDS credits, and advance tax.'
                : 'Adjust your search query or filters to view other payouts.'}
            </p>
            {incomes.length === 0 && (
              <button
                type="button"
                onClick={onOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log First Income</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-4 py-3">Client &amp; Channel</th>
                  <th className="text-right px-4 py-3">Gross</th>
                  <th className="text-right px-4 py-3">TDS</th>
                  <th className="text-right px-4 py-3">GST</th>
                  <th className="text-right px-4 py-3">Net Cash</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((item) => {
                  const netCash = Math.max(0, item.grossAmount - item.tdsAmount);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {item.receivedDate}
                      </td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="font-medium text-slate-900">{item.clientName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{item.platform}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.category}</span>
                          {item.notes && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[180px]">{item.notes}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(item.grossAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {item.tdsAmount > 0 ? formatINR(item.tdsAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {item.gstAmount > 0 ? formatINR(item.gstAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(netCash)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleStatus(
                              item.id,
                              item.status === 'received' ? 'pending' : 'received'
                            )
                          }
                          className={`text-xs font-medium cursor-pointer hover:underline ${
                            item.status === 'received' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {item.status === 'received' ? 'Received' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {confirmDeleteId === item.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDelete(item.id);
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
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenEdit(item)}
                              aria-label={`Edit ${item.clientName}`}
                              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              aria-label={`Delete ${item.clientName}`}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={2} className="px-5 py-3 text-xs text-slate-600">
                    Filtered Total ({filtered.length} entries)
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatINR(totals.gross)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    {formatINR(totals.tds)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    {formatINR(totals.gst)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatINR(totals.net)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
