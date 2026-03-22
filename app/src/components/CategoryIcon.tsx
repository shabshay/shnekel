import type { Category } from '../types';
import { getCategories } from '../lib/storage';

export function CategoryIcon({ category, size = 'md' }: { category: Category; size?: 'sm' | 'md' }) {
  const cat = getCategories().find(c => c.key === category);
  const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  const color = cat?.color ?? '#78909C';
  const icon = cat?.icon ?? 'more_horiz';

  return (
    <div
      className={`${sizeClasses} rounded-lg flex items-center justify-center`}
      style={{ backgroundColor: color + '18' }}
    >
      <span className="material-symbols-outlined" style={{ color }}>
        {icon}
      </span>
    </div>
  );
}
