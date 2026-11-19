import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingAuthView } from './components/LandingAuthView';
import { WorkspaceShell } from './components/WorkspaceShell';
import { auth, signInWithGoogle, signOutUser } from './lib/firebase';
import {
  createClient,
  createIncome,
  createWorkflow,
  deleteClient,
  deleteIncome,
  deleteWorkflow,
  ensureUserProfile,
  seedStarterWorkspace,
  subscribeClients,
  subscribeIncomes,
  subscribeUserProfile,
  subscribeWorkflows,
  toggleIncomeStatus,
  updateClient,
  updateIncome,
  updateUserSettings,
  updateWorkflow,
  updateWorkflowStatus,
  type ClientInput,
  type IncomeInput,
  type WorkflowInput,
} from './lib/firestoreService';
import type {
  ClientRecord,
  IncomeEntry,
  IncomeStatus,
  TaxRegime,
  UserProfile,
  WorkflowStatus,
  WorkflowTask,
} from './types';

function WorkspaceApp() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTask[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setProfile(null);
        setIncomes([]);
        setWorkflows([]);
        setClients([]);
        setLoadingData(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    let active = true;
    setLoadingData(true);

    ensureUserProfile(user)
      .then((initialProfile) => {
        if (active) {
          setProfile(initialProfile);
        }
      })
      .catch((err) => {
        console.error(err);
      });

    const unsubProfile = subscribeUserProfile(user.uid, (nextProfile) => {
      if (active && nextProfile) {
        setProfile(nextProfile);
      }
    });

    const unsubIncomes = subscribeIncomes(user.uid, (entries) => {
      if (active) {
        setIncomes(entries);
        setLoadingData(false);
      }
    });

    const unsubWorkflows = subscribeWorkflows(user.uid, (tasks) => {
      if (active) {
        setWorkflows(tasks);
      }
    });

    const unsubClients = subscribeClients(user.uid, (records) => {
      if (active) {
        setClients(records);
      }
    });

    return () => {
      active = false;
      unsubProfile();
      unsubIncomes();
      unsubWorkflows();
      unsubClients();
    };
  }, [authReady, user]);

  async function handleGoogleSignIn() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing Google authentication.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Please allow popups for this site to sign in with Google.');
      } else {
        setAuthError(
          error instanceof Error ? error.message : 'Unable to sign in with Google.'
        );
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await signOutUser();
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Loading ShivamVenture...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <LandingAuthView
        onGoogleSignIn={handleGoogleSignIn}
        authLoading={authLoading}
        authError={authError}
      />
    );
  }

  return (
    <WorkspaceShell
      profile={profile}
      incomes={incomes}
      workflows={workflows}
      clients={clients}
      loadingData={loadingData}
      onSignOut={handleSignOut}
      onSeedSampleData={() => seedStarterWorkspace(user.uid)}
      onSaveSettings={(updates: {
        businessName: string;
        city: string;
        taxRegime: TaxRegime;
        gstRegistered: boolean;
        annualTarget: number;
      }) => updateUserSettings(user.uid, updates)}
      onSaveIncome={(input: IncomeInput, existingId?: string) =>
        existingId ? updateIncome(existingId, input) : createIncome(user.uid, input)
      }
      onToggleIncomeStatus={(id: string, nextStatus: IncomeStatus) =>
        toggleIncomeStatus(id, nextStatus)
      }
      onDeleteIncome={(id: string) => deleteIncome(id)}
      onSaveWorkflow={(input: WorkflowInput, existingId?: string) =>
        existingId
          ? updateWorkflow(existingId, input)
          : createWorkflow(user.uid, input)
      }
      onUpdateWorkflowStatus={(id: string, status: WorkflowStatus) =>
        updateWorkflowStatus(id, status)
      }
      onDeleteWorkflow={(id: string) => deleteWorkflow(id)}
      onSaveClient={(input: ClientInput, existingId?: string) =>
        existingId ? updateClient(existingId, input) : createClient(user.uid, input)
      }
      onDeleteClient={(id: string) => deleteClient(id)}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceApp />
    </ErrorBoundary>
  );
}
