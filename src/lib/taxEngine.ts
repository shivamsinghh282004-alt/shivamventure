import type { IncomeEntry, TaxRegime } from '../types';

export interface TaxSlabRow {
  range: string;
  rateLabel: string;
  taxableSlice: number;
  taxAmount: number;
}

export interface AdvanceTaxInstallment {
  quarter: string;
  dueDate: string;
  dueDateIso: string;
  cumulativePercent: number;
  cumulativeAmount: number;
  installmentAmount: number;
  status: 'passed' | 'upcoming' | 'future';
  daysDelta: number;
}

export interface MonthlyCashflowPoint {
  monthKey: string;
  label: string;
  gross: number;
  taxReserve: number;
  netTakeHome: number;
}

export interface TaxComputationResult {
  receivedGross: number;
  pendingGross: number;
  totalGross: number;
  totalTds: number;
  totalGst: number;
  taxableIncome: number;
  deductionAmount: number;
  slabTax: number;
  rebate87A: number;
  cessAmount: number;
  totalIncomeTax: number;
  netAdvanceTaxPayable: number;
  effectiveTaxRate: number;
  recommendedSetAsidePercent: number;
  netTakeHomeAfterTax: number;
  gstThresholdProgress: number;
  slabs: TaxSlabRow[];
  installments: AdvanceTaxInstallment[];
}

export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}

export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return formatINR(amount);
}

/**
 * Computes Indian Income Tax under FY 2025-26 / 2026-27 New Regime slabs
 * paired with optional Section 44ADA 50% presumptive profession deduction.
 */
export function computeIndianTax(
  grossAnnualReceipts: number,
  tdsDeducted: number,
  gstCollected: number,
  regime: TaxRegime,
  pendingGross = 0,
  referenceDateIso = '2026-11-19'
): TaxComputationResult {
  const receivedGross = Math.max(0, grossAnnualReceipts);
  const netServiceReceipts = Math.max(0, receivedGross - gstCollected);

  const deductionAmount =
    regime === '44ada' ? Math.round(netServiceReceipts * 0.5) : 0;
  const taxableIncome = Math.max(0, netServiceReceipts - deductionAmount);

  const slabBrackets: Array<{ min: number; max: number; rate: number; label: string }> = [
    { min: 0, max: 400000, rate: 0, label: 'Up to ₹4,00,000' },
    { min: 400000, max: 800000, rate: 0.05, label: '₹4,00,001 – ₹8,00,000' },
    { min: 800000, max: 1200000, rate: 0.1, label: '₹8,00,001 – ₹12,00,000' },
    { min: 1200000, max: 1600000, rate: 0.15, label: '₹12,00,001 – ₹16,00,000' },
    { min: 1600000, max: 2000000, rate: 0.2, label: '₹16,00,001 – ₹20,00,000' },
    { min: 2000000, max: 2400000, rate: 0.25, label: '₹20,00,001 – ₹24,00,000' },
    { min: 2400000, max: Infinity, rate: 0.3, label: 'Above ₹24,00,000' },
  ];

  const slabs: TaxSlabRow[] = slabBrackets.map((b) => {
    const slice = Math.max(0, Math.min(taxableIncome, b.max) - b.min);
    const taxAmount = Math.round(slice * b.rate);
    return {
      range: b.label,
      rateLabel: `${Math.round(b.rate * 100)}%`,
      taxableSlice: slice,
      taxAmount,
    };
  });

  const rawSlabTax = slabs.reduce((sum, s) => sum + s.taxAmount, 0);

  // Section 87A rebate under New Regime: zero tax if taxable income <= ₹12,00,000
  const rebate87A = taxableIncome <= 1200000 ? rawSlabTax : 0;
  const taxAfterRebate = Math.max(0, rawSlabTax - rebate87A);
  const cessAmount = Math.round(taxAfterRebate * 0.04);
  const totalIncomeTax = taxAfterRebate + cessAmount;
  const netAdvanceTaxPayable = Math.max(0, totalIncomeTax - tdsDeducted);

  const effectiveTaxRate =
    netServiceReceipts > 0 ? (totalIncomeTax / netServiceReceipts) * 100 : 0;
  const recommendedSetAsidePercent =
    netServiceReceipts > 0
      ? Math.min(35, Math.max(0, (netAdvanceTaxPayable / netServiceReceipts) * 100))
      : regime === '44ada'
        ? 5
        : 12;

  const netTakeHomeAfterTax = Math.max(
    0,
    netServiceReceipts - Math.max(totalIncomeTax, tdsDeducted)
  );

  const gstThresholdProgress = Math.min(100, (netServiceReceipts / 2000000) * 100);

  const refDate = new Date(`${referenceDateIso}T00:00:00`);
  const installmentDefs = [
    { quarter: 'Q1 Installment', dueDate: '15 Jun 2026', dueDateIso: '2026-06-15', pct: 15 },
    { quarter: 'Q2 Installment', dueDate: '15 Sep 2026', dueDateIso: '2026-09-15', pct: 45 },
    { quarter: 'Q3 Installment', dueDate: '15 Dec 2026', dueDateIso: '2026-12-15', pct: 75 },
    { quarter: 'Q4 Installment', dueDate: '15 Mar 2027', dueDateIso: '2027-03-15', pct: 100 },
  ];

  let prevCum = 0;
  let foundUpcoming = false;
  const installments: AdvanceTaxInstallment[] = installmentDefs.map((def) => {
    const cumAmt = Math.round((netAdvanceTaxPayable * def.pct) / 100);
    const instAmt = Math.max(0, cumAmt - prevCum);
    prevCum = cumAmt;
    const due = new Date(`${def.dueDateIso}T00:00:00`);
    const daysDelta = Math.round((due.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    let status: 'passed' | 'upcoming' | 'future' = 'future';
    if (daysDelta < 0) {
      status = 'passed';
    } else if (!foundUpcoming) {
      status = 'upcoming';
      foundUpcoming = true;
    }
    return {
      quarter: def.quarter,
      dueDate: def.dueDate,
      dueDateIso: def.dueDateIso,
      cumulativePercent: def.pct,
      cumulativeAmount: cumAmt,
      installmentAmount: instAmt,
      status,
      daysDelta,
    };
  });

  return {
    receivedGross,
    pendingGross,
    totalGross: receivedGross + pendingGross,
    totalTds: tdsDeducted,
    totalGst: gstCollected,
    taxableIncome,
    deductionAmount,
    slabTax: rawSlabTax,
    rebate87A,
    cessAmount,
    totalIncomeTax,
    netAdvanceTaxPayable,
    effectiveTaxRate,
    recommendedSetAsidePercent,
    netTakeHomeAfterTax,
    gstThresholdProgress,
    slabs,
    installments,
  };
}

export function computeWorkspaceTaxSummary(
  incomes: IncomeEntry[],
  regime: TaxRegime,
  referenceDateIso = '2026-11-19'
): TaxComputationResult {
  const received = incomes.filter((i) => i.status === 'received');
  const pending = incomes.filter((i) => i.status === 'pending');

  const receivedGross = received.reduce((sum, i) => sum + i.grossAmount, 0);
  const pendingGross = pending.reduce((sum, i) => sum + i.grossAmount, 0);
  const totalTds = received.reduce((sum, i) => sum + i.tdsAmount, 0);
  const totalGst = received.reduce((sum, i) => sum + i.gstAmount, 0);

  return computeIndianTax(
    receivedGross,
    totalTds,
    totalGst,
    regime,
    pendingGross,
    referenceDateIso
  );
}

export function buildMonthlyCashflow(
  incomes: IncomeEntry[],
  setAsidePercent: number
): MonthlyCashflowPoint[] {
  const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const fyOrder = [
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
    '2027-01',
    '2027-02',
    '2027-03',
  ];

  const buckets = new Map<string, number>();
  for (const key of fyOrder) {
    buckets.set(key, 0);
  }

  for (const item of incomes) {
    if (item.status !== 'received') continue;
    const monthKey = item.receivedDate.slice(0, 7);
    if (buckets.has(monthKey)) {
      buckets.set(monthKey, (buckets.get(monthKey) ?? 0) + item.grossAmount);
    }
  }

  // Show the active 8 months of FY 2026-27 (Apr - Nov) or any months with data
  const points = fyOrder.map((key, idx) => {
    const gross = buckets.get(key) ?? 0;
    const taxReserve = Math.round((gross * setAsidePercent) / 100);
    const netTakeHome = Math.max(0, gross - taxReserve);
    return {
      monthKey: key,
      label: monthNames[idx],
      gross,
      taxReserve,
      netTakeHome,
    };
  });

  return points.slice(0, 8);
}
