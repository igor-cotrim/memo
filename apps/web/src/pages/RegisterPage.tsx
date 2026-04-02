import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Input, Label, Alert } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { getErrorMessage } from "../utils/error";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, localeLabel, toggleLocale } = useLocale();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, name, password);
      navigate("/");
    } catch (err: unknown) {
      setError(getErrorMessage(err, t("register.failed")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-bg-primary relative overflow-hidden before:content-[''] before:absolute before:-top-[40%] before:-left-[30%] before:w-[160%] before:h-[160%] before:bg-accent-primary/5 before:animate-bg-drift before:z-0">
      <div className="bg-bg-glass backdrop-blur-md border border-border rounded-xl p-11 w-full max-w-[430px] shadow-lg relative z-10 animate-card-entrance">
        <div className="flex items-center justify-between mb-6">
          <div className="font-display text-[1.5rem] font-extrabold text-accent-primary flex items-center gap-2 tracking-tight">
            <span className="text-[1.5rem] text-current!">⚡</span> FlashMind
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-bold text-[0.75rem] font-display transition-all whitespace-nowrap tracking-widest uppercase bg-white/5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 border border-border hover:border-accent-primary/30"
            onClick={toggleLocale}
            aria-label={`Switch language to ${localeLabel === "EN" ? "Portuguese" : "English"}`}
          >
            {localeLabel}
          </button>
        </div>
        <h1 className="font-display text-[1.75rem] font-extrabold text-center mb-2 tracking-tight text-balance">
          {t("register.title")}
        </h1>
        <p className="text-center text-text-secondary text-[0.9375rem] mb-8">
          {t("register.subtitle")}
        </p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex flex-col gap-1.5 stagger-1">
            <Label htmlFor="register-name">{t("register.nameLabel")}</Label>
            <Input
              id="register-name"
              type="text"
              placeholder={t("register.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1.5 stagger-2">
            <Label htmlFor="register-email">{t("register.emailLabel")}</Label>
            <Input
              id="register-email"
              type="email"
              placeholder={t("register.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-1.5 stagger-3">
            <Label htmlFor="register-password">
              {t("register.passwordLabel")}
            </Label>
            <Input
              id="register-password"
              type="password"
              placeholder={t("register.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button
            className="w-full stagger-4"
            size="lg"
            type="submit"
            disabled={loading}
          >
            {loading ? t("register.submitting") : t("register.submit")}
          </Button>
        </form>

        <div className="text-center mt-7 text-text-secondary text-sm stagger-5">
          {t("register.hasAccount")}{" "}
          <Link
            to="/login"
            className="text-accent-primary hover:text-accent-secondary transition-colors"
          >
            {t("register.signIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
