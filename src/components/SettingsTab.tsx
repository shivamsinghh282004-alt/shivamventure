import { useState, type FormEvent } from 'react';
import { Check, LogOut } from 'lucide-react';
import { BLUEPRINT_LIMITS, type TaxRegime, type UserProfile } from '../types';

interface SettingsTabProps {
  profile: UserProfile;
  onSaveSettings: (updates: {
    businessName: string;
    city: string;
    taxRegime: TaxRegime;
    gstRegistered: boolean;
    annualTarget: number;
  }) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function SettingsTab({
  profile,
  onSaveSettings,
  onSignOut,
}: SettingsTabProps) {
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [city, setCity] = useState(profile.city);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(profile.taxRegime);
  const [gstRegistered, setGstRegistered] = useState(profile.gstRegistered);
  const [annualTarget, setAnnualTarget] = useState(String(profile.annualTarget));
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedBanner(false);
    try {
      await onSaveSettings({
        businessName,
        city,
        taxRegime,
        gstRegistered,
        annualTarget: Number(annualTarget) || 0,
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-base shrink-0">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-base font-semibold text-slate-900 font-display">
              {profile.displayName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {profile.email} · Verified Google Account
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900 font-display">
            Practice &amp; Tax Profile
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synced privately to your Firestore account across devices
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-business"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Venture / Practice Name
            </label>
            <input
              id="settings-business"
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.maxBusinessName}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="settings-city"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Operating City
            </label>
            <input
              id="settings-city"
              type="text"
              maxLength={BLUEPRINT_LIMITS.maxCity}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Delhi NCR, Dehradun"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-target"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              FY 2026-27 Income Goal (INR)
            </label>
            <input
              id="settings-target"
              type="number"
              min={0}
              max={BLUEPRINT_LIMITS.maxAnnualTarget}
              value={annualTarget}
              onChange={(e) => setAnnualTarget(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="settings-regime"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Default Income Tax Regime
            </label>
            <select
              id="settings-regime"
              value={taxRegime}
              onChange={(e) => setTaxRegime(e.target.value as TaxRegime)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              <option value="44ada">Section 44ADA (50% Presumptive)</option>
              <option value="new_regime">New Tax Regime (Standard)</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={gstRegistered}
            onChange={(e) => setGstRegistered(e.target.checked)}
            className="rounded border-slate-300 accent-slate-900 cursor-pointer"
          />
          <span>I am registered under GST (18% domestic / 0% LUT export)</span>
        </label>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="text-xs text-emerald-700 flex items-center gap-1.5">
            {savedBanner && (
              <>
                <Check className="w-4 h-4" />
                <span>Settings saved to cloud workspace</span>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
