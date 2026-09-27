import { LogOut } from 'lucide-react';

import { useDashboardNavigation } from '../../../navigation';

import { useDashboard } from '../state/DashboardProvider';
import { NAV_ITEMS } from './navItems';

import { useAdminAuth } from '../../../../auth/AdminAuth';

/** Dashboard navigation stays inside this component and preserves the host URL. */
export function MobileTabBar() {
  const { dict } = useDashboard();
  const { page, setPage } = useDashboardNavigation();

  const { signOut } = useAdminAuth() as unknown as {
    signOut: () => void;
  };

  const handleLogout = () => {
    const confirmed = window.confirm('هل أنت متأكد من تسجيل الخروج؟');

    if (!confirmed) return;

    signOut();
  };

  return (
    <nav
      aria-label={dict.nav.menu}
      className="
        no-print
        fixed inset-x-0 bottom-0 z-40
        border-t border-hairline
        bg-city-emerald
        pb-[env(safe-area-inset-bottom,0px)]
        md:hidden
      "
    >
      <div className="overflow-x-auto">
        <ul className="flex min-w-max items-stretch px-1">

          {NAV_ITEMS.map((item) => {
            const isActive = item.id === page;

            return (
              <li
                key={item.id}
                className="w-[72px] shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setPage(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex w-full flex-col items-center gap-1 px-1 py-2 text-[10px] transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-white/55',
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

          <li className="w-[72px] shrink-0 border-s border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="
                flex w-full
                flex-col items-center
                gap-1
                px-1 py-2
                text-[10px]
                text-white/55
                transition-colors
                hover:text-red-300
              "
            >
              <LogOut
                className="size-5"
                aria-hidden="true"
              />

              <span className="w-full truncate text-center leading-tight">
                خروج
              </span>
            </button>
          </li>

        </ul>
      </div>
    </nav>
  );
}