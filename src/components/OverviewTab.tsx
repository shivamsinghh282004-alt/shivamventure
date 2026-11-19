import { ArrowUpRight, CheckCircle2, Circle, Clock, Database, Plus } from 'lucide-react';
import {
  buildMonthlyCashflow,
  computeWorkspaceTaxSummary,
  formatCompactINR,
  formatINR,
} from '../lib/taxEngine';
import type { IncomeEntry, UserProfile, WorkflowStatus, WorkflowTask } from '../types';

interface OverviewTabProps {
  profile: UserProfile;
  incomes: IncomeEntry[];
  workflows: WorkflowTask[];
  loadingData: boolean;
  seeding: boolean;
  onSeedSampleData: () => Promise<void>;
  onOpenAddIncome: () => void;
  onOpenAddTask: () => void;
  onToggleTaskStatus: (task: WorkflowTask, nextStatus: WorkflowStatus) => Promise<void>;
  onNavigateTab: (tab: 'income' | 'tax' | 'workflows' | 'clients') => void;
}

export function OverviewTab({
  profile,
  incomes,
  workflows,
  loadingData,
  seeding,
  onSeedSampleData,
  onOpenAddIncome,
  onOpenAddTask,
  onToggleTaskStatus,
  onNavigateTab,
}: OverviewTabProps) {
  const tax = computeWorkspaceTaxSummary(incomes, profile.taxRegime);
  const monthlySeries = buildMonthlyCashflow(incomes, tax.recommendedSetAsidePercent);
  const maxBar = Math.max(100000, ...monthlySeries.map((m) => m.gross));

  const nextInstallment =
    tax.installments.find((i) => i.status === 'upcoming') ?? tax.installments[3];

  const openTasks = workflows.filter((w) => w.status !== 'completed').slice(0, 5);
  const targetProgress =
    profile.annualTarget > 0
      ? Math.min(100, Math.round((tax.receivedGross / profile.annualTarget) * 100))
      : 0;

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Empty State Onboarding Banner when user has no entries yet */}
      {incomes.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900 font-display">
              Welcome to {profile.businessName}
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Your workspace is connected to Google Sign-In and private cloud storage. Log your first client payout to compute FY 2026-27 advance tax reserves, or load sample Indian freelancer records to explore the dashboard immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onSeedSampleData}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>{seeding ? 'Loading Sample Data...' : 'Load Sample Freelancer Data'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddIncome}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Log First Income</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Received FYTD</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1.5">
            {formatINR(tax.receivedGross)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span>{targetProgress}% of {formatCompactINR(profile.annualTarget)} goal</span>
            <span aria-hidden="true">·</span>
            <span>{formatINR(tax.pendingGross)} pending</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Net Advance Tax Due</div>
          <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums mt-1.5">
            {formatINR(tax.netAdvanceTaxPayable)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span>{profile.taxRegime === '44ada' ? 'Sec 44ADA' : 'New Regime'}</span>
            <span aria-hidden="true">·</span>
            <span>{formatINR(tax.totalTds)} TDS credited</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Safe Net Take-Home</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums mt-1.5">
            {formatINR(tax.netTakeHomeAfterTax)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span>Set aside {tax.recommendedSetAsidePercent.toFixed(1)}%</span>
            <span aria-hidden="true">·</span>
            <span>{formatINR(tax.totalGst)} GST</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Next Advance Tax Deadline</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1.5">
            {nextInstallment.dueDate}
          </div>
          <div className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
            <span>{nextInstallment.daysDelta >= 0 ? `${nextInstallment.daysDelta} days left` : 'Due'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{formatINR(nextInstallment.cumulativeAmount)} cumulative</span>
          </div>
        </div>
      </div>

      {/* Main 2-column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: Cashflow Bar Chart + Advance Tax Schedule */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Monthly Cash-Flow &amp; Tax Reserve
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  FY 2026-27 received payouts split between take-home cash and tax reserve
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-900 inline-block" />
                  <span>Net Take-Home</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
                  <span>Tax Reserve</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-2 sm:gap-4 items-end h-52 pt-4 border-b border-slate-200 pb-3">
              {monthlySeries.map((point) => {
                const totalHeightPct = Math.max(4, Math.round((point.gross / maxBar) * 100));
                const reserveHeightPct =
                  point.gross > 0
                    ? Math.round((point.taxReserve / point.gross) * totalHeightPct)
                    : 0;
                const netHeightPct = Math.max(0, totalHeightPct - reserveHeightPct);

                return (
                  <div
                    key={point.monthKey}
                    className="flex flex-col items-center justify-end h-full group"
                    title={`${point.label}: ${formatINR(point.gross)} gross`}
                  >
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-full">
                      {point.gross > 0 ? formatCompactINR(point.gross) : '₹0'}
                    </div>
                    <div className="w-full max-w-[38px] flex flex-col justify-end h-36 bg-slate-50 rounded-t-md overflow-hidden">
                      {point.gross > 0 ? (
                        <>
                          <div
                            style={{ height: `${reserveHeightPct}%` }}
                            className="w-full bg-blue-600 transition-all duration-200"
                          />
                          <div
                            style={{ height: `${netHeightPct}%` }}
                            className="w-full bg-slate-900 transition-all duration-200"
                          />
                        </>
                      ) : (
                        <div className="w-full h-1 bg-slate-200" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-8 gap-2 sm:gap-4 pt-2">
              {monthlySeries.map((point) => (
                <div
                  key={point.monthKey}
                  className="text-center text-xs font-medium text-slate-500"
                >
                  {point.label}
                </div>
              ))}
            </div>
          </div>

          {/* Advance Tax Installments Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Advance Tax Installment Schedule
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory Indian quarterly milestones · Cumulative liability after TDS credits
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('tax')}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Open Tax Simulator</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="text-left px-6 py-2.5">Installment</th>
                    <th className="text-left px-4 py-2.5">Due Date</th>
                    <th className="text-right px-4 py-2.5">Target %</th>
                    <th className="text-right px-4 py-2.5">Quarter Amount</th>
                    <th className="text-right px-6 py-2.5">Cumulative Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tax.installments.map((row) => (
                    <tr
                      key={row.quarter}
                      className={`h-11 ${
                        row.status === 'upcoming' ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-2.5 font-medium text-slate-900">
                        <span>{row.quarter}</span>
                        {row.status === 'upcoming' && (
                          <span className="ml-2 text-xs font-medium text-amber-700">
                            · Next due
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-mono text-xs tabular-nums">
                        {row.dueDate}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                        {row.cumulativePercent}%
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                        {formatINR(row.installmentAmount)}
                      </td>
                      <td className="px-6 py-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatINR(row.cumulativeAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Priority Workflow Queue + GST Threshold */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-semibold text-slate-900 font-display">
                GST ₹20L Threshold Monitor
              </h2>
              <span className="text-xs font-mono font-medium text-slate-600 tabular-nums">
                {tax.gstThresholdProgress.toFixed(0)}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                style={{ width: `${Math.min(100, tax.gstThresholdProgress)}%` }}
                className={`h-full transition-all duration-300 ${
                  tax.gstThresholdProgress >= 85 ? 'bg-amber-600' : 'bg-slate-900'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Service turnover: {formatINR(tax.receivedGross - tax.totalGst)}</span>
              <span>Limit: ₹20,00,000</span>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {profile.gstRegistered
                ? 'GST registration active. Export services under LUT remain 0% rated; domestic invoices attract 18% GST.'
                : 'Mandatory GST registration triggers once aggregate annual service turnover crosses ₹20 lakh.'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Priority Workflows
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {openTasks.length} active follow-ups &amp; tax tasks
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddTask}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Task</span>
              </button>
            </div>

            {openTasks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500 mb-3">
                  No active workflow reminders.
                </p>
                <button
                  type="button"
                  onClick={onOpenAddTask}
                  className="text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
                >
                  Create your first reminder
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {openTasks.map((task) => (
                  <li
                    key={task.id}
                    className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTaskStatus(task, 'completed')}
                      aria-label={`Mark ${task.title} complete`}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                    >
                      {task.status === 'in_progress' ? (
                        <Clock className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 leading-snug">
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{task.dueDate}</span>
                        {task.amountLinked > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-700">
                              {formatINR(task.amountLinked)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onNavigateTab('workflows')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>View all workflows</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('income')}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer whitespace-nowrap"
              >
                Income ledger →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
