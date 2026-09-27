
import { useDashboardNavigation } from '../../../navigation';

import { useDashboard } from '../state/DashboardProvider';
import { NAV_ITEMS } from './navItems';

/** Dashboard navigation stays inside this component and preserves the host URL. */
export function MobileTabBar() {
  const { dict } = useDashboard();
  const { page, setPage } = useDashboardNavigation();

  return (
    <nav
      aria-label={dict.nav.menu}
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-city-emerald pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      <ul className="flex items-stretch justify-between px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === page;
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => setPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex w-full flex-col items-center gap-1 px-1 py-2 text-[10px] transition-colors',
                  isActive ? 'text-white' : 'text-white/55',
                ].join(' ')}
              >
                <item.Icon className="size-5" />
                <span className="w-full truncate text-center leading-tight">
                  {item.label(dict)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
