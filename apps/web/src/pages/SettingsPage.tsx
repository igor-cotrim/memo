import { useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { t } = useLocale();

  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);
    try {
      const result = await api.updateProfile({ name });
      updateUser(result.user);
      setProfileSuccess(t("settings.profileUpdated"));
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("settings.profileFailed");
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setProfileError(axiosErr.response?.data?.error ?? msg);
      } else {
        setProfileError(msg);
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"));
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(t("settings.passwordChanged"));
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("settings.passwordFailed");
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setPasswordError(axiosErr.response?.data?.error ?? msg);
      } else {
        setPasswordError(msg);
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  const inputClass =
    "bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-0 w-full";

  const labelClass =
    "font-display text-xs font-semibold text-text-secondary uppercase tracking-widest";

  const buttonClass =
    "inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md font-bold text-base font-display text-bg-primary bg-accent-primary shadow-sm transition-all tracking-tight hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed";

  return (
    <div className="animate-fade-slide-up">
      <h1 className="font-display text-[1.75rem] font-extrabold tracking-tight mb-1">
        {t("settings.title")}
      </h1>
      <p className="text-text-secondary text-[0.9375rem] mb-8">
        {t("settings.subtitle")}
      </p>

      <div className="flex flex-col gap-8 max-w-[520px]">
        {/* Profile Section */}
        <div className="bg-bg-card border border-border rounded-xl p-8">
          <h2 className="font-display text-lg font-bold mb-6">
            {t("settings.profileSection")}
          </h2>

          <form className="flex flex-col gap-5" onSubmit={handleProfileSubmit}>
            {profileError && (
              <div
                className="text-accent-danger text-[0.813rem] font-medium px-3 py-2 bg-accent-danger/10 rounded-sm border-l-[3px] border-accent-danger"
                role="alert"
              >
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="text-accent-success text-[0.813rem] font-medium px-3 py-2 bg-accent-success/10 rounded-sm border-l-[3px] border-accent-success">
                {profileSuccess}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="settings-email">
                {t("settings.emailLabel")}
              </label>
              <input
                id="settings-email"
                className={`${inputClass} opacity-60 cursor-not-allowed`}
                type="email"
                value={user?.email ?? ""}
                disabled
              />
              <span className="text-text-muted text-xs">
                {t("settings.emailReadOnly")}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="settings-name">
                {t("settings.nameLabel")}
              </label>
              <input
                id="settings-name"
                className={inputClass}
                type="text"
                placeholder={t("settings.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <button
              className={buttonClass}
              type="submit"
              disabled={profileLoading}
            >
              {profileLoading
                ? t("settings.savingProfile")
                : t("settings.saveProfile")}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-bg-card border border-border rounded-xl p-8">
          <h2 className="font-display text-lg font-bold mb-6">
            {t("settings.passwordSection")}
          </h2>

          <form className="flex flex-col gap-5" onSubmit={handlePasswordSubmit}>
            {passwordError && (
              <div
                className="text-accent-danger text-[0.813rem] font-medium px-3 py-2 bg-accent-danger/10 rounded-sm border-l-[3px] border-accent-danger"
                role="alert"
              >
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="text-accent-success text-[0.813rem] font-medium px-3 py-2 bg-accent-success/10 rounded-sm border-l-[3px] border-accent-success">
                {passwordSuccess}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="settings-current-password">
                {t("settings.currentPasswordLabel")}
              </label>
              <input
                id="settings-current-password"
                className={inputClass}
                type="password"
                placeholder={t("settings.currentPasswordPlaceholder")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="settings-new-password">
                {t("settings.newPasswordLabel")}
              </label>
              <input
                id="settings-new-password"
                className={inputClass}
                type="password"
                placeholder={t("settings.newPasswordPlaceholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="settings-confirm-password">
                {t("settings.confirmPasswordLabel")}
              </label>
              <input
                id="settings-confirm-password"
                className={inputClass}
                type="password"
                placeholder={t("settings.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              className={buttonClass}
              type="submit"
              disabled={passwordLoading}
            >
              {passwordLoading
                ? t("settings.changingPassword")
                : t("settings.changePassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
