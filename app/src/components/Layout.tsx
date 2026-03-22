import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/add', icon: 'add_circle', label: 'Add' },
  { to: '/recurring', icon: 'repeat', label: 'Recurring' },
  { to: '/reports', icon: 'monitoring', label: 'Reports' },
];

export function Layout() {
  return (
    <div className="min-h-dvh pb-24">
      <Outlet />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white/80 backdrop-blur-3xl rounded-t-3xl shadow-[0_-20px_40px_rgba(19,27,46,0.04)]">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
                isActive
                  ? 'text-on-tertiary-container font-bold'
                  : 'text-slate-400 hover:text-on-tertiary-container'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-headline font-medium text-[10px] tracking-wide uppercase mt-0.5">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
