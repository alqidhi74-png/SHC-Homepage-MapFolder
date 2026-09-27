import { useDashboardNavigation } from '../../../navigation';

import { useDashboard } from '../state/DashboardProvider';
import { locales } from '../../../lib/i18n/config';
import { SegmentedControl } from '../ui/SegmentedControl';

/** Changes the dashboard language without navigating away from its host page. */
export function LanguageSwitch() {
  const { dict, locale } = useDashboard();
  const { setLocale } = useDashboardNavigation();

  return (
    <SegmentedControl
      ariaLabel={dict.settingsPage.language.title}
      value={locale}
      onChange={setLocale}
      options={locales.map((value) => ({
        value,
        label: value === 'ar' ? dict.settingsPage.language.ar : dict.settingsPage.language.en,
      }))}
    />
  );
}
