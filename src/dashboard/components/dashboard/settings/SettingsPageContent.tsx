import { useState } from 'react';
import { LogOut } from 'lucide-react';

import { useDashboard } from '../state/DashboardProvider';
import { Card, CardHeader } from '../ui/Card';

import { ProfileCard } from './ProfileCard';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeSwitch } from './ThemeSwitch';
import { NotificationToggles } from './NotificationToggles';
import { AlertThresholds } from './AlertThresholds';

import { useAdminAuth } from '../../../../auth/AdminAuth';

export function SettingsPageContent() {
  const { dict } = useDashboard();

  const { signOut } = useAdminAuth() as unknown as {
    signOut: () => void;
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    signOut();
  };

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <ProfileCard />

          <Card>
            <CardHeader title={dict.settingsPage.preferences} />

            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-[11px] text-ink-subtle">
                  {dict.settingsPage.language.title}
                </p>

                <LanguageSwitch />
              </div>

              <div>
                <p className="mb-1.5 text-[11px] text-ink-subtle">
                  {dict.settingsPage.theme.title}
                </p>

                <ThemeSwitch />
              </div>
            </div>
          </Card>

          {/* Mobile Logout */}
          <div className="md:hidden">
            <Card>
              <div className="mobile-logout-section">
                <div className="mobile-logout-info">
                  <div className="mobile-logout-icon">
                    <LogOut aria-hidden="true" />
                  </div>

                  <div>
                    <h3>تسجيل الخروج</h3>

                    <p>
                      الخروج من لوحة التحكم والعودة إلى صفحة تسجيل الدخول
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="mobile-logout-button"
                  onClick={() => setShowLogoutModal(true)}
                >
                  <LogOut aria-hidden="true" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader title={dict.settingsPage.notifications.title} />
            <NotificationToggles />
          </Card>

          <Card>
            <AlertThresholds />
          </Card>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="logout-modal-backdrop"
          onMouseDown={() => setShowLogoutModal(false)}
        >
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-logout-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="logout-modal-icon">
              <LogOut aria-hidden="true" />
            </div>

            <div className="logout-modal-content">
              <span className="logout-modal-eyebrow">
                لوحة التحكم
              </span>

              <h2 id="mobile-logout-title">
                تسجيل الخروج
              </h2>

              <p>
                هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة التحكم؟
              </p>
            </div>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-modal-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="logout-modal-confirm"
                onClick={handleConfirmLogout}
              >
                <LogOut aria-hidden="true" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}