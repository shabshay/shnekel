export type Period = 'daily' | 'weekly' | 'monthly';

// Category is now a string to support custom categories
export type Category = string;

export interface CategoryInfo {
  key: Category;
  label: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Settings {
  period: Period;
  budgetAmount: number;
  monthStartDay: number; // 1-28, which day of the month the budget resets
  alertThreshold: number; // 0-100, percentage to trigger budget warning (default 80)
  darkMode: boolean;
  dateMode?: 'transaction' | 'billing'; // which date to use for budget calculations (default: transaction)
  categoryBudgets?: Record<string, number>; // per-category budget limits, e.g. { "groceries": 3000 }
  onboardingComplete: boolean;
  customCategories?: CategoryInfo[];
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string — transaction date
  billingDate?: string; // ISO string — credit card charge date
  notes?: string;
  receiptUrl?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringExpense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  frequency: RecurringFrequency;
  dayOfMonth?: number;    // 1-28, for monthly
  dayOfWeek?: number;     // 0=Sun, 1=Mon, ... for weekly
  lastGenerated?: string; // ISO date string of last auto-generated expense
  active: boolean;
  createdAt: string;      // ISO string
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { key: 'food', label: 'Food', icon: 'restaurant', color: '#FF6B35', isDefault: true },
  { key: 'groceries', label: 'Groceries', icon: 'local_grocery_store', color: '#4CAF50', isDefault: true },
  { key: 'transport', label: 'Transport', icon: 'directions_car', color: '#4E7CFF', isDefault: true },
  { key: 'shopping', label: 'Shopping', icon: 'shopping_bag', color: '#E040FB', isDefault: true },
  { key: 'entertainment', label: 'Fun', icon: 'sports_esports', color: '#FFD600', isDefault: true },
  { key: 'bills', label: 'Bills', icon: 'receipt_long', color: '#26A69A', isDefault: true },
  { key: 'health', label: 'Health', icon: 'favorite', color: '#EF5350', isDefault: true },
  { key: 'other', label: 'Other', icon: 'more_horiz', color: '#78909C', isDefault: true },
];

// Backward compat alias
export const CATEGORIES = DEFAULT_CATEGORIES;

// ─── Shared Budgets ─────────────────────────────────────────────

export interface SharedBudget {
  id: string;
  ownerId: string;
  ownerEmail: string;
  memberId?: string;
  memberEmail: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
}

export type AccountContext =
  | { type: 'personal' }
  | { type: 'shared'; ownerId: string; ownerEmail: string; budgetId: string };

export const AVAILABLE_ICONS = [
  'restaurant', 'local_grocery_store', 'directions_car', 'shopping_bag', 'sports_esports', 'receipt_long',
  'favorite', 'more_horiz', 'child_care', 'pets', 'home', 'school', 'flight',
  'local_cafe', 'fitness_center', 'music_note', 'phone_iphone', 'checkroom',
  'savings', 'redeem', 'local_gas_station', 'build', 'park',
];

export const AVAILABLE_COLORS = [
  '#FF6B35', '#4E7CFF', '#E040FB', '#FFD600', '#26A69A', '#EF5350', '#78909C',
  '#FF4081', '#7C4DFF', '#00BCD4', '#8BC34A', '#FF9800', '#795548', '#607D8B',
];
