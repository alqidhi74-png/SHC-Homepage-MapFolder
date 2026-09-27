
import { useDashboardNavigation } from '../../../navigation';

import { useDashboard } from '../state/DashboardProvider';
import { NAV_ITEMS } from './navItems';

/** Dashboard navigation stays inside this component and preserves the host URL. */
export function Sidebar() {
  const { dict } = useDashboard();
  const { page, setPage } = useDashboardNavigation();

  return (
    <nav
      aria-label={dict.nav.menu}
      className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-city-emerald text-white/90 md:flex"
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="bg-gold-gradient grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-city-emerald">
          ن
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{dict.nav.brandShort}</p>
          <p className="truncate text-[11px] text-white/55">{dict.nav.brand}</p>
        </div>
      </div>

      <ul className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === page;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-white/12 font-semibold text-white'
                    : 'text-white/70 hover:bg-white/8 hover:text-white',
                ].join(' ')}
              >
                <item.Icon className="size-5 shrink-0" />
                <span className="truncate text-start">{item.label(dict)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="px-5 py-5 text-[11px] leading-relaxed text-white/40">
        {dict.meta.description}
      </p>
    </nav>
  );
}
