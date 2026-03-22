import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Import } from './pages/Import';
import { Recurring } from './pages/Recurring';
import { AddExpenseModal } from './components/AddExpenseModal';
import { useState, useEffect } from 'react';
import { useExpenses } from './hooks/useExpenses';
import { pullFromSupabase, migrateLocalToSupabase } from './lib/sync';
import { processRecurringExpenses } from './lib/storage';
import type { Category } from './types';

function AddExpensePage({ settings }: { settings: ReturnType<typeof useSettings>['settings'] }) {
  const { addExpense } = useExpenses(settings.period, settings.budgetAmount, settings.monthStartDay);
  const [open] = useState(true);

  return (
    <AddExpenseModal
      open={open}
      onClose={() => window.history.back()}
      onAdd={(amount: number, category: Category, description: string) => {
        addExpense(amount, category, description);
        window.history.back();
      }}
    />
  );
}

function AuthenticatedApp() {
  const { settings, updateSettings, completeOnboarding } = useSettings();

  // On mount: process recurring, migrate local data & pull remote data
  useEffect(() => {
    processRecurringExpenses();
    migrateLocalToSupabase().then(() => pullFromSupabase());

    // Periodic pull every 5 minutes
    const interval = setInterval(() => {
      pullFromSupabase();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!settings.onboardingComplete) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard settings={settings} onUpdateSettings={updateSettings} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/add" element={<AddExpensePage settings={settings} />} />
          <Route path="/import" element={<Import />} />
          <Route path="/recurring" element={<Recurring />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary-container text-4xl animate-spin">
            progress_activity
          </span>
          <h1 className="font-headline font-black text-primary-container text-2xl tracking-tight">
            Shnekel
          </h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

export default App;
