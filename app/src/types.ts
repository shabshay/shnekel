export type Period = 'daily' | 'weekly' | 'monthly';

export type Category = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'other';

export interface Settings {
  period: Period;
  budgetAmount: number;
  monthStartDay: number; // 1-28, which day of the month the budget resets
  onboardingComplete: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string
}

export const CATEGORIES: { key: Category; label: string; icon: string; color: string }[] = [
  { key: 'food', label: 'Food', icon: 'restaurant', color: '#FF6B35' },
  { key: 'transport', label: 'Transport', icon: 'directions_car', color: '#4E7CFF' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping_bag', color: '#E040FB' },
  { key: 'entertainment', label: 'Fun', icon: 'sports_esports', color: '#FFD600' },
  { key: 'bills', label: 'Bills', icon: 'receipt_long', color: '#26A69A' },
  { key: 'health', label: 'Health', icon: 'favorite', color: '#EF5350' },
  { key: 'other', label: 'Other', icon: 'more_horiz', color: '#78909C' },
];
