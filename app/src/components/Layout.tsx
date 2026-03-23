import { NavLink, Outlet } from 'react-router-dom';
import { CoinLogo } from './CoinLogo';

const leftNav = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/recurring', icon: 'repeat', label: 'Recurring' },
];

const rightNav = [
  { to: '/reports', icon: 'monitoring', label: 'Reports' },
  { to: '/import', icon: 'upload_file', label: 'Import' },
];

export function Layout() {
  return (
    <div className="min-h-dvh pb-24">
      <Outlet />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex items-end justify-center px-4 pb-6 pt-3 bg-white/85 backdrop-blur-lg rounded-t-3xl shadow-[0_-20px_40px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-around w-full max-w-md">
          {/* Left nav items */}
          {leftNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-all active:scale-90 duration-200 ${
                  isActive
                    ? 'text-on-tertiary-container'
                    : 'text-slate-400 hover:text-on-tertiary-container'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-xl ${isActive ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="font-headline font-medium text-[9px] tracking-wide mt-0.5">
                    {item.label}
                  </span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-on-tertiary-container mt-0.5" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Center FAB - Add */}
          <NavLink
            to="/add"
            className="flex flex-col items-center -mt-8"
          >
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center shadow-lg shadow-primary-container/30 active:scale-95 transition-transform">
              <CoinLogo size="sm" />
            </div>
            <span className="font-headline font-semibold text-[9px] tracking-wide mt-1 text-on-primary-fixed">
              Add
            </span>
          </NavLink>

          {/* Right nav items */}
          {rightNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-all active:scale-90 duration-200 ${
                  isActive
                    ? 'text-on-tertiary-container'
                    : 'text-slate-400 hover:text-on-tertiary-container'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-xl ${isActive ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="font-headline font-medium text-[9px] tracking-wide mt-0.5">
                    {item.label}
                  </span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-on-tertiary-container mt-0.5" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
