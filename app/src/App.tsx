import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
import { Layout } from './components/Layout';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Import } from './pages/Import';
import { AddExpenseModal } from './components/AddExpenseModal';
import { useState } from 'react';
import { useExpenses } from './hooks/useExpenses';
import type { Category } from './types';

function AddExpensePage({ settings }: { settings: ReturnType<typeof useSettings>['settings']; updateSettings: ReturnType<typeof useSettings>['updateSettings'] }) {
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

function App() {
  const { settings, updateSettings, completeOnboarding } = useSettings();

  if (!settings.onboardingComplete) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard settings={settings} onUpdateSettings={updateSettings} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/add" element={<AddExpensePage settings={settings} updateSettings={updateSettings} />} />
          <Route path="/import" element={<Import />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
