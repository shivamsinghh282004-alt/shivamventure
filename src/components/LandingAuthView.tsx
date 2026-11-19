import { useState } from 'react';
import { ArrowRight, CalendarClock, Check, Layers, ShieldCheck, Wallet } from 'lucide-react';
import { computeIndianTax, formatINR } from '../lib/taxEngine';
import type { TaxRegime } from '../types';
import { BrandMark, GoogleLogo } from './GoogleMark';

interface LandingAuthViewProps {
  onGoogleSignIn: () => Promise<void>;
  authLoading: boolean;
  authError: string | null;
}

export function LandingAuthView({
  onGoogleSignIn,
  authLoading,
  authError,
}: LandingAuthViewProps) {
  const [previewIncome, setPreviewIncome] = useState<number>(1450000);
  const [previewTds, setPreviewTds] = useState<number>(65000);
  const [previewRegime, setPreviewRegime] = useState<TaxRegime>('44ada');

  const previewTax = computeIndianTax(previewIncome, previewTds, 0, previewRegime);
  const q3Installment = previewTax.installments[2];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
          >
            <BrandMark className="w-6 h-6 shrink-0" />
            <span>ShivamVenture</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#overview"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#tax-engine"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Tax Engine
            </a>
            <a
              href="#workflows"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Workflows
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={authLoading}
              className="inline-flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <GoogleLogo className="w-4 h-4 shrink-0" />
              <span>{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section id="overview" className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-3">
                  Built for Indian Freelancers &amp; Small Teams
                </p>
                <h1
                  className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-5 font-display"
                  style={{ textWrap: 'balance' }}
                >
                  Track every client payout, advance tax slab, and workflow in one ledger.
                </h1>
                <p className="text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                  Stop guessing how much of each client payment to set aside. Consolidate income across Upwork, Razorpay, and direct bank transfers, model Section 44ADA vs New Regime taxes, and stay ahead of quarterly deadlines.
                </p>

                {authError && (
                  <div
                    role="alert"
                    className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
                  >
                    {authError}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={authLoading}
                    className="inline-flex items-center gap-3 px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    <GoogleLogo className="w-4 h-4 shrink-0" />
                    <span>{authLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <a
                    href="#tax-engine"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    Preview Tax Calculator
                  </a>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <span>Google OAuth Verified Workspace</span>
                <span aria-hidden="true">·</span>
                <span>Section 44ADA &amp; FY 2026-27 Slabs</span>
                <span aria-hidden="true">·</span>
                <span>Private Per-Account Firestore Sync</span>
              </div>
            </div>

            {/* Right Column: Live Interactive Tax & Cashflow Workbench */}
            <div
              id="tax-engine"
              className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 lg:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 font-display">
                      Interactive Advance Tax Estimator
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Adjust annual freelance receipts to preview real FY 2026-27 reserve math
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewRegime('44ada')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        previewRegime === '44ada'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sec 44ADA (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRegime('new_regime')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        previewRegime === 'new_regime'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      New Regime
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <label htmlFor="preview-income" className="font-medium text-slate-700">
                        Annual Gross Freelance Income
                      </label>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatINR(previewIncome)}
                      </span>
                    </div>
                    <input
                      id="preview-income"
                      type="range"
                      min={400000}
                      max={3500000}
                      step={50000}
                      value={previewIncome}
                      onChange={(e) => setPreviewIncome(Number(e.target.value))}
                      className="w-full accent-blue-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 font-mono mt-1">
                      <span>₹4L</span>
                      <span>₹15L</span>
                      <span>₹25L</span>
                      <span>₹35L</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <label htmlFor="preview-tds" className="font-medium text-slate-700">
                        Client TDS Already Deducted (Sec 194J)
                      </label>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatINR(previewTds)}
                      </span>
                    </div>
                    <input
                      id="preview-tds"
                      type="range"
                      min={0}
                      max={Math.round(previewIncome * 0.1)}
                      step={5000}
                      value={Math.min(previewTds, Math.round(previewIncome * 0.1))}
                      onChange={(e) => setPreviewTds(Number(e.target.value))}
                      className="w-full accent-blue-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Taxable Income</div>
                  <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1">
                    {formatINR(previewTax.taxableIncome)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {previewRegime === '44ada' ? '50% presumptive deduction' : 'Full slab calculation'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500">Net Advance Tax Due</div>
                  <div className="text-xl font-bold font-mono text-blue-700 tabular-nums mt-1">
                    {formatINR(previewTax.netAdvanceTaxPayable)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Set aside {previewTax.recommendedSetAsidePercent.toFixed(1)}% per payout
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Next deadline: <strong className="text-slate-900">{q3Installment.dueDate}</strong> ({q3Installment.cumulativePercent}% cumulative)
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatINR(q3Installment.cumulativeAmount)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Full-width 3-column Mechanism-to-Outcome Strip */}
        <section id="workflows" className="border-y border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-14">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                Replace disconnected spreadsheets and WhatsApp reminders
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Designed around the daily operational bottlenecks of independent designers, developers, tutors, and small project teams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="pt-4 border-t border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5 font-display">
                  01. Multi-Platform Income Ledger
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Log payouts from Direct UPI, Upwork, Fiverr, Razorpay, and Stripe with TDS and GST split out cleanly on every invoice.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5 font-display">
                  02. Advance Tax &amp; GST Guardrails
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Real-time Q1–Q4 installment readiness and ₹20 Lakh GST threshold tracking prevent last-minute Section 234B/234C interest penalties.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5 font-display">
                  03. Automated Client Workflows
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Keep invoice follow-ups, client deliverables, and compliance milestones in one structured queue synced across sessions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section (aligned with Venture Plan Mission 7) */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                Transparent plans for solo freelancers and growing teams
              </h2>
              <p className="text-sm text-slate-600 mt-1.5">
                Start immediately with Google Sign-In. Export your ledger anytime as CSV.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">For solo freelancers</div>
                <div className="flex items-baseline gap-2 mt-2 mb-4">
                  <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">₹0</span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Essential income tracking, Section 44ADA estimator, and advance tax calendar.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited client &amp; platform income entries</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>FY 2026-27 Advance Tax &amp; GST threshold tracker</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Workflow &amp; deadline checklist</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={authLoading}
                className="w-full py-2.5 px-4 text-sm font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Start Free with Google
              </button>
            </div>

            <div className="bg-white border border-slate-900 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-blue-700">For scaling SMBs &amp; retainers</div>
                <div className="flex items-baseline gap-2 mt-2 mb-4">
                  <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">₹999</span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Full workflow automation, multi-client retainer templates, and audit-ready CSV exports.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-700 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Everything in Solo Starter</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Client directory with TDS &amp; LUT export rules</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>What-if payout reserve calculator &amp; CSV exports</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <GoogleLogo className="w-4 h-4 shrink-0" />
                <span>Sign in to Launch Workspace</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>ShivamVenture · Built for Indian Freelancers &amp; Small Businesses</span>
          </div>
          <div>Protected by Google Authentication &amp; Owner-Isolated Cloud Firestore</div>
        </div>
      </footer>
    </div>
  );
}
