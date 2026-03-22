import { CATEGORIES } from '../types';
import type { Category } from '../types';

export function CategoryIcon({ category, size = 'md' }: { category: Category; size?: 'sm' | 'md' }) {
  const cat = CATEGORIES.find(c => c.key === category);
  if (!cat) return null;

  const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';

  return (
    <div
      className={`${sizeClasses} rounded-lg flex items-center justify-center`}
      style={{ backgroundColor: cat.color + '18' }}
    >
      <span className="material-symbols-outlined" style={{ color: cat.color }}>
        {cat.icon}
      </span>
    </div>
  );
}
