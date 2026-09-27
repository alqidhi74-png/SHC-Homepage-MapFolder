import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from './lib/i18n/config';

export type DashboardPage = 'overview' | 'requests' | 'properties' | 'city-live' | 'reports' | 'settings';

type Navigation = {
  page: DashboardPage;
  locale: Locale;
  setPage: (page: DashboardPage) => void;
  setLocale: (locale: Locale) => void;
};

const NavigationContext = createContext<Navigation | null>(null);

/** Local navigation works inside any host router, including BrowserRouter and HashRouter. */
export function DashboardNavigation({
  initialLocale,
  initialPage,
  children,
}: {
  initialLocale: Locale;
  initialPage: DashboardPage;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [page, setPage] = useState(initialPage);
  const value = useMemo(() => ({ locale, page, setLocale, setPage }), [locale, page]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useDashboardNavigation(): Navigation {
  const navigation = useContext(NavigationContext);
  if (!navigation) throw new Error('Dashboard navigation must be used inside Dashboard.');
  return navigation;
}
