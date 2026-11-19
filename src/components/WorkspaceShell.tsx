import { useState } from 'react';
import {
  Calculator,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ReceiptIndianRupee,
  Settings,
  Users,
  X,
} from 'lucide-react';
import type { ClientInput, IncomeInput, WorkflowInput } from '../lib/firestoreService';
import type {
  ClientRecord,
  IncomeEntry,
  IncomeStatus,
  TaxRegime,
  UserProfile,
  WorkflowStatus,
  WorkflowTask,
} from '../types';
import { ClientsTab } from './ClientsTab';
import { BrandMark } from './GoogleMark';
import { IncomeLedgerTab } from './IncomeLedgerTab';
import { OverviewTab } from './OverviewTab';
import { SettingsTab } from './SettingsTab';
import { TaxEstimatorTab } from './TaxEstimatorTab';
import { WorkflowsTab } from './WorkflowsTab';
import { ClientModal, IncomeModal, WorkflowModal } from './WorkspaceModals';

export type WorkspaceTabId =
  | 'overview'
  | 'income'
  | 'tax'
  | 'workflows'
  | 'clients'
  | 'settings';

interface WorkspaceShellProps {
  profile: UserProfile;
  incomes: IncomeEntry[];
  workflows: WorkflowTask[];
  clients: ClientRecord[];
  loadingData: boolean;
  onSignOut: () => Promise<void>;
  onSeedSampleData: () => Promise<void>;
  onSaveSettings: (updates: {
    businessName: string;
    city: string;
    taxRegime: TaxRegime;
    gstRegistered: boolean;
    annualTarget: number;
  }) => Promise<void>;
  onSaveIncome: (input: IncomeInput, existingId?: string) => Promise<void>;
  onToggleIncomeStatus: (id: string, nextStatus: IncomeStatus) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onSaveWorkflow: (input: WorkflowInput, existingId?: string) => Promise<void>;
  onUpdateWorkflowStatus: (id: string, status: WorkflowStatus) => Promise<void>;
  onDeleteWorkflow: (id: string) => Promise<void>;
  onSaveClient: (input: ClientInput, existingId?: string) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTabId;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'income', label: 'Income Ledger', icon: ReceiptIndianRupee },
  { id: 'tax', label: 'Tax & GST', icon: Calculator },
  { id: 'workflows', label: 'Workflows', icon: CheckSquare },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function WorkspaceShell({
  profile,
  incomes,
  workflows,
  clients,
  loadingData,
  onSignOut,
  onSeedSampleData,
  onSaveSettings,
  onSaveIncome,
  onToggleIncomeStatus,
  onDeleteIncome,
  onSaveWorkflow,
  onUpdateWorkflowStatus,
  onDeleteWorkflow,
  onSaveClient,
  onDeleteClient,
}: WorkspaceShellProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [incomeModalState, setIncomeModalState] = useState<{
    open: boolean;
    entry: IncomeEntry | null;
    prefillClient: ClientRecord | null;
  }>({ open: false, entry: null, prefillClient: null });

  const [workflowModalState, setWorkflowModalState] = useState<{
    open: boolean;
    task: WorkflowTask | null;
  }>({ open: false, task: null });

  const [clientModalState, setClientModalState] = useState<{
    open: boolean;
    client: ClientRecord | null;
  }>({ open: false, client: null });

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  async function handleSeed() {
    setSeeding(true);
    try {
      await onSeedSampleData();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen">
        <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-2.5">
          <BrandMark className="w-6 h-6 shrink-0" />
          <span className="text-base font-bold tracking-tight text-slate-900 truncate font-display">
            ShivamVenture
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {profile.displayName}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{profile.businessName}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline truncate">
                {profile.businessName}
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate font-display">
                {activeNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setWorkflowModalState({ open: true, task: null })}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>New Task</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setIncomeModalState({ open: true, entry: null, prefillClient: null })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Log Income</span>
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 flex flex-col z-10">
              <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BrandMark className="w-6 h-6 shrink-0" />
                  <span className="text-base font-bold text-slate-900 font-display">
                    ShivamVenture
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              profile={profile}
              incomes={incomes}
              workflows={workflows}
              loadingData={loadingData}
              seeding={seeding}
              onSeedSampleData={handleSeed}
              onOpenAddIncome={() =>
                setIncomeModalState({ open: true, entry: null, prefillClient: null })
              }
              onOpenAddTask={() => setWorkflowModalState({ open: true, task: null })}
              onToggleTaskStatus={(task, nextStatus) =>
                onUpdateWorkflowStatus(task.id, nextStatus)
              }
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'income' && (
            <IncomeLedgerTab
              incomes={incomes}
              onOpenAdd={() =>
                setIncomeModalState({ open: true, entry: null, prefillClient: null })
              }
              onOpenEdit={(entry) =>
                setIncomeModalState({ open: true, entry, prefillClient: null })
              }
              onToggleStatus={onToggleIncomeStatus}
              onDelete={onDeleteIncome}
            />
          )}

          {activeTab === 'tax' && (
            <TaxEstimatorTab
              profile={profile}
              incomes={incomes}
              onSaveTaxPreferences={async ({ taxRegime, gstRegistered }) => {
                await onSaveSettings({
                  businessName: profile.businessName,
                  city: profile.city,
                  taxRegime,
                  gstRegistered,
                  annualTarget: profile.annualTarget,
                });
              }}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowsTab
              workflows={workflows}
              onOpenAdd={() => setWorkflowModalState({ open: true, task: null })}
              onOpenEdit={(task) => setWorkflowModalState({ open: true, task })}
              onUpdateStatus={onUpdateWorkflowStatus}
              onDelete={onDeleteWorkflow}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsTab
              clients={clients}
              incomes={incomes}
              onOpenAdd={() => setClientModalState({ open: true, client: null })}
              onOpenEdit={(client) => setClientModalState({ open: true, client })}
              onLogPayoutForClient={(client) =>
                setIncomeModalState({ open: true, entry: null, prefillClient: client })
              }
              onDelete={onDeleteClient}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              profile={profile}
              onSaveSettings={onSaveSettings}
              onSignOut={onSignOut}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {incomeModalState.open && (
        <IncomeModal
          initialEntry={incomeModalState.entry}
          prefillClient={incomeModalState.prefillClient}
          onClose={() =>
            setIncomeModalState({ open: false, entry: null, prefillClient: null })
          }
          onSave={onSaveIncome}
        />
      )}

      {workflowModalState.open && (
        <WorkflowModal
          initialTask={workflowModalState.task}
          onClose={() => setWorkflowModalState({ open: false, task: null })}
          onSave={onSaveWorkflow}
        />
      )}

      {clientModalState.open && (
        <ClientModal
          initialClient={clientModalState.client}
          onClose={() => setClientModalState({ open: false, client: null })}
          onSave={onSaveClient}
        />
      )}
    </div>
  );
}
