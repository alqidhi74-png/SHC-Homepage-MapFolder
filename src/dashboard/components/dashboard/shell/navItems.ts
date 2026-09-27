import type { ReactElement, SVGProps } from 'react';
import type { Dictionary } from '../../../lib/i18n/get-dictionary';
import type { DashboardPage } from '../../../navigation';
import {
  CityLiveIcon,
  OverviewIcon,
  PropertiesIcon,
  ReportsIcon,
  RequestsIcon,
  SettingsIcon,
} from '../ui/Icons';

export type NavItem = {
  id: DashboardPage;
  label: (dict: Dictionary) => string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: (d) => d.nav.overview, Icon: OverviewIcon },
  { id: 'requests', label: (d) => d.nav.requests, Icon: RequestsIcon },
  { id: 'properties', label: (d) => d.nav.properties, Icon: PropertiesIcon },
  { id: 'city-live', label: (d) => d.nav.cityLive, Icon: CityLiveIcon },
  { id: 'reports', label: (d) => d.nav.reports, Icon: ReportsIcon },
  { id: 'settings', label: (d) => d.nav.settings, Icon: SettingsIcon },
];

