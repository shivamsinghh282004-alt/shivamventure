import { useState } from 'react';
import { computeWorkspaceTaxSummary, formatINR } from '../lib/taxEngine';
import type { IncomeEntry, TaxRegime, UserProfile } from '../types';

interface TaxEstimatorTabProps {
  profile: UserProfile;
  incomes: IncomeEntry[];
  onSaveTaxPreferences: (updates: {
    taxRegime: TaxRegime;
    gstRegistered: boolean;
  }) => Promise<void>;
}

export function TaxEstimatorTab({
  profile,
  incomes,
  onSaveTaxPreferences,
}: TaxEstimatorTabProps) {
  const [savingPref, setSavingPref] = useState(false);
  const [nextInvoiceAmount, setNextInvoiceAmount] = useState<number>(100000);
  const [nextInvoiceHasTds, setNextInvoiceHasTds] = useState<boolean>(true);

  const tax = computeWorkspaceTaxSummary(incomes, profile.taxRegime);

  const tdsOnNext = nextInvoiceHasTds ? Math.round(nextInvoiceAmount * 0.1) : 0;
  const gstOnNext = profile.gstRegistered ? Math.round(nextInvoiceAmount * 0.18) : 0;
  const cashReceived = nextInvoiceAmount + gstOnNext - tdsOnNext;
  const reserveForIncomeTax = Math.round(
    (nextInvoiceAmount * tax.recommendedSetAsidePercent) / 100
  );
  const safeToSpend = Math.max(0, cashReceived - gstOnNext - reserveForIncomeTax);

  async function handleRegimeChange(regime: TaxRegime) {
    if (regime === profile.taxRegime) return;
    setSavingPref(true);
    try {
      await onSaveTaxPreferences({
        taxRegime: regime,
        gstRegistered: profile.gstRegistered,
      });
    } finally {
      setSavingPref(false);
    }
  }

  async function handleGstToggle() {
    setSavingPref(true);
    try {
      await onSaveTaxPreferences({
        taxRegime: profile.taxRegime,
        gstRegistered: !profile.gstRegistered,
      });
    } finally {
      setSavingPref(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 font-display">
            FY 2026-27 Indian Tax &amp; GST Computation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Switch between Section 44ADA presumptive taxation (50% flat expense deduction) and full New Regime slabs. Changes save automatically to your profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              disabled={savingPref}
              onClick={() => handleRegimeChange('44ada')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                profile.taxRegime === '44ada'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sec 44ADA (50% Presumptive)
            </button>
            <button
              type="button"
              disabled={savingPref}
              onClick={() => handleRegimeChange('new_regime')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                profile.taxRegime === 'new_regime'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Regime (Standard)
            </button>
          </div>

          <button
            type="button"
            disabled={savingPref}
            onClick={handleGstToggle}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              profile.gstRegistered
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {profile.gstRegistered ? 'GST Registered: Active' : 'GST Registered: Off'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Full Computation Ledger & Slab Breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 font-display">
              Tax Liability Breakdown (Received FYTD)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Includes Section 87A rebate up to ₹12,00,000 taxable income and 4% Health &amp; Education Cess
            </p>
          </div>

          <div className="divide-y divide-slate-200 text-sm">
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-slate-600">Gross Service Receipts (excl. GST)</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {formatINR(tax.receivedGross - tax.totalGst)}
              </span>
            </div>
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-slate-600">
                {profile.taxRegime === '44ada'
                  ? 'Sec 44ADA 50% Presumptive Deduction'
                  : 'Presumptive Deduction (Not Applied)'}
              </span>
              <span className="font-mono font-medium text-emerald-700 tabular-nums">
                − {formatINR(tax.deductionAmount)}
              </span>
            </div>
            <div className="px-6 py-3 flex items-center justify-between bg-slate-50">
              <span className="font-medium text-slate-900">Net Taxable Income</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatINR(tax.taxableIncome)}
              </span>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
            New Regime Slab Breakdown
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="text-left px-6 py-2.5 font-medium">Income Bracket</th>
                  <th className="text-right px-4 py-2.5 font-medium">Rate</th>
                  <th className="text-right px-4 py-2.5 font-medium">Taxable Slice</th>
                  <th className="text-right px-6 py-2.5 font-medium">Slab Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tax.slabs.map((slab) => (
                  <tr key={slab.range} className="h-10">
                    <td className="px-6 py-2 text-slate-700">{slab.range}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-slate-500 tabular-nums">
                      {slab.rateLabel}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-slate-700 tabular-nums">
                      {formatINR(slab.taxableSlice)}
                    </td>
                    <td className="px-6 py-2 text-right font-mono text-slate-900 tabular-nums">
                      {formatINR(slab.taxAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-200 border-t border-slate-200 text-sm">
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-slate-600">Section 87A Rebate</span>
              <span className="font-mono text-emerald-700 tabular-nums">
                − {formatINR(tax.rebate87A)}
              </span>
            </div>
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-slate-600">Health &amp; Education Cess (4%)</span>
              <span className="font-mono text-slate-900 tabular-nums">
                {formatINR(tax.cessAmount)}
              </span>
            </div>
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-slate-600">Less: Client TDS Credits (Form 26AS)</span>
              <span className="font-mono text-emerald-700 tabular-nums">
                − {formatINR(tax.totalTds)}
              </span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50">
              <span className="font-semibold text-slate-900">Net Advance Tax Payable</span>
              <span className="text-lg font-bold font-mono text-blue-700 tabular-nums">
                {formatINR(tax.netAdvanceTaxPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Interactive Next Payment Splitter */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900 font-display">
              What-If Next Payment Splitter
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter an upcoming client invoice to see exactly how much to move into your tax reserve versus operating cash.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <label htmlFor="what-if-amount" className="font-medium text-slate-700">
                Invoice Base Fee (INR)
              </label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatINR(nextInvoiceAmount)}
              </span>
            </div>
            <input
              id="what-if-amount"
              type="number"
              min={1000}
              max={10000000}
              step={5000}
              value={nextInvoiceAmount}
              onChange={(e) => setNextInvoiceAmount(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={nextInvoiceHasTds}
              onChange={(e) => setNextInvoiceHasTds(e.target.checked)}
              className="rounded border-slate-300 accent-slate-900 cursor-pointer"
            />
            <span>Client deducts 10% TDS (Section 194J)</span>
          </label>

          <div className="pt-4 border-t border-slate-200 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Net Bank Credit</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {formatINR(cashReceived)}
              </span>
            </div>
            {profile.gstRegistered && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Hold for GST Payable (18%)</span>
                <span className="font-mono text-amber-700 tabular-nums">
                  {formatINR(gstOnNext)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                Move to Tax Reserve ({tax.recommendedSetAsidePercent.toFixed(1)}%)
              </span>
              <span className="font-mono font-medium text-blue-700 tabular-nums">
                {formatINR(reserveForIncomeTax)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Safe to Spend</span>
              <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                {formatINR(safeToSpend)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
