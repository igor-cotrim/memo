import { useState } from "react";

import { Button, Input, Label, Alert } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import * as api from "../services/api";
import { getErrorMessage } from "../utils/error";

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
      setProfileError(getErrorMessage(err, t("settings.profileFailed")));
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
      setPasswordError(getErrorMessage(err, t("settings.passwordFailed")));
    } finally {
      setPasswordLoading(false);
    }
  }

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
            {profileError && <Alert variant="danger">{profileError}</Alert>}
            {profileSuccess && (
              <Alert variant="success">{profileSuccess}</Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-email">{t("settings.emailLabel")}</Label>
              <Input
                id="settings-email"
                className="opacity-60 cursor-not-allowed"
                type="email"
                value={user?.email ?? ""}
                disabled
              />
              <span className="text-text-muted text-xs">
                {t("settings.emailReadOnly")}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-name">{t("settings.nameLabel")}</Label>
              <Input
                id="settings-name"
                type="text"
                placeholder={t("settings.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={profileLoading}>
              {profileLoading
                ? t("settings.savingProfile")
                : t("settings.saveProfile")}
            </Button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-bg-card border border-border rounded-xl p-8">
          <h2 className="font-display text-lg font-bold mb-6">
            {t("settings.passwordSection")}
          </h2>

          <form className="flex flex-col gap-5" onSubmit={handlePasswordSubmit}>
            {passwordError && <Alert variant="danger">{passwordError}</Alert>}
            {passwordSuccess && (
              <Alert variant="success">{passwordSuccess}</Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-current-password">
                {t("settings.currentPasswordLabel")}
              </Label>
              <Input
                id="settings-current-password"
                type="password"
                placeholder={t("settings.currentPasswordPlaceholder")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-new-password">
                {t("settings.newPasswordLabel")}
              </Label>
              <Input
                id="settings-new-password"
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
              <Label htmlFor="settings-confirm-password">
                {t("settings.confirmPasswordLabel")}
              </Label>
              <Input
                id="settings-confirm-password"
                type="password"
                placeholder={t("settings.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading
                ? t("settings.changingPassword")
                : t("settings.changePassword")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
