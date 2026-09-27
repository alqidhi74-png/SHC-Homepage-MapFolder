import { useEffect } from 'react';
import { DashboardChrome } from './components/dashboard/DashboardChrome';
import { OverviewContent } from './components/dashboard/OverviewContent';
import { RequestsPageContent } from './components/dashboard/requests/RequestsPageContent';
import { PropertiesPageContent } from './components/dashboard/properties/PropertiesPageContent';
import { CityLivePageContent } from './components/dashboard/live/CityLivePageContent';
import { ReportsPageContent } from './components/dashboard/reports/ReportsPageContent';
import { SettingsPageContent } from './components/dashboard/settings/SettingsPageContent';
import { ThemeProvider, useTheme } from './components/dashboard/state/ThemeProvider';
import { useStory } from './components/dashboard/state/StoryProvider';
import { cityData } from './lib/data';
import { dirOf, type Locale } from './lib/i18n/config';
import { getDictionary } from './lib/i18n/get-dictionary';
import { DashboardNavigation, useDashboardNavigation, type DashboardPage } from './navigation';
import type { CityData } from './types/dashboard';
import './dashboard.css';

export type DashboardProps = {
  initialLocale?: Locale;
  initialPage?: DashboardPage;
  /** Omit to use the bundled demo data. */
  data?: CityData;
  className?: string;
};

const pages = {
  overview: OverviewContent,
  requests: RequestsPageContent,
  properties: PropertiesPageContent,
  'city-live': CityLivePageContent,
  reports: ReportsPageContent,
  settings: SettingsPageContent,
} satisfies Record<DashboardPage, () => React.JSX.Element>;

function PageContent() {
  const { page } = useDashboardNavigation();
  const { running, stop } = useStory();
  useEffect(() => {
    if (running && page !== 'overview') stop();
  }, [page, running, stop]);
  const Page = pages[page];
  return <Page />;
}

function DashboardView({ data, className }: { data: CityData; className: string }) {
  const { locale } = useDashboardNavigation();
  const { mode } = useTheme();

  return (
    <div
      className={`shc-dashboard ${mode === 'dark' ? 'shc-dashboard-dark' : ''} ${className}`.trim()}
      lang={locale}
      dir={dirOf(locale)}
    >
      <DashboardChrome data={data} locale={locale} dict={getDictionary(locale)}>
        <PageContent />
      </DashboardChrome>
    </div>
  );
}

/** Drop into a React page. No Next.js, router provider or Tailwind setup is required. */
export default function Dashboard({
  initialLocale = 'ar',
  initialPage = 'overview',
  data = cityData,
  className = '',
}: DashboardProps) {
  return (
    <DashboardNavigation initialLocale={initialLocale} initialPage={initialPage}>
      <ThemeProvider>
        <DashboardView data={data} className={className} />
      </ThemeProvider>
    </DashboardNavigation>
  );
}
