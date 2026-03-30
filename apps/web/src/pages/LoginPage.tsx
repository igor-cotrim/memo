import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";

export default function LoginPage() {
  const { login } = useAuth();
  const { t, localeLabel, toggleLocale } = useLocale();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("login.failed");
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error ?? msg);
      } else {
        setError(msg);
      }
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
        <h1 className="font-display text-[1.75rem] font-extrabold text-center mb-2 tracking-tight">
          {t("login.title")}
        </h1>
        <p className="text-center text-text-secondary text-[0.9375rem] mb-8">
          {t("login.subtitle")}
        </p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && (
            <div
              className="text-accent-danger text-[0.813rem] font-medium px-3 py-2 bg-accent-danger/10 rounded-sm border-l-[3px] border-accent-danger"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5 stagger-1">
            <label
              className="font-display text-xs font-semibold text-text-secondary uppercase tracking-widest"
              htmlFor="login-email"
            >
              {t("login.emailLabel")}
            </label>
            <input
              id="login-email"
              className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-0 w-full"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-1.5 stagger-2">
            <label
              className="font-display text-xs font-semibold text-text-secondary uppercase tracking-widest"
              htmlFor="login-password"
            >
              {t("login.passwordLabel")}
            </label>
            <input
              id="login-password"
              className="bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-0 w-full"
              type="password"
              placeholder={t("login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 w-full px-8 py-3.5 rounded-md font-bold text-base font-display text-bg-primary bg-accent-primary shadow-sm transition-all tracking-tight hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 disabled:opacity-45 disabled:cursor-not-allowed stagger-3"
            type="submit"
            disabled={loading}
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <div className="text-center mt-7 text-text-secondary text-sm stagger-4">
          {t("login.noAccount")}{" "}
          <Link
            to="/register"
            className="text-accent-primary hover:text-accent-secondary transition-colors"
          >
            {t("login.createOne")}
          </Link>
        </div>
      </div>
    </div>
  );
}
