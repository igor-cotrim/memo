import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button, Input, Label, Alert, FieldError } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';
import { useFormValidation } from '../hooks/useFormValidation';
import { getErrorMessage } from '../utils/error';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, localeLabel, toggleLocale } = useLocale();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    errors: fieldErrors,
    validate,
    clearFieldError,
  } = useFormValidation(
    {
      email: { required: true, email: true },
      password: { required: true },
    },
    t,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate({ email, password })) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('login.failed')));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-bg-primary relative overflow-hidden before:content-[''] before:absolute before:-top-[40%] before:-left-[30%] before:w-[160%] before:h-[160%] before:bg-accent-primary/5 before:animate-bg-drift before:z-0">
      <div className="bg-bg-glass backdrop-blur-md border border-border rounded-xl p-11 w-full max-w-[430px] shadow-lg relative z-10 animate-card-entrance">
        <div className="flex items-center justify-between mb-6">
          <div className="font-display text-[1.5rem] font-extrabold text-accent-primary flex items-center gap-2 tracking-tight">
            <span className="text-[1.5rem] text-current!">⚡</span> Memô
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-sm font-bold text-[0.75rem] font-display transition-all whitespace-nowrap tracking-widest uppercase bg-white/5 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 border border-border hover:border-accent-primary/30"
            onClick={toggleLocale}
            aria-label={`Switch language to ${localeLabel === 'EN' ? 'Portuguese' : 'English'}`}
          >
            {localeLabel}
          </button>
        </div>
        <h1 className="font-display text-[1.75rem] font-extrabold text-center mb-2 tracking-tight">
          {t('login.title')}
        </h1>
        <p className="text-center text-text-secondary text-[0.9375rem] mb-8">
          {t('login.subtitle')}
        </p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex flex-col gap-1.5 stagger-1">
            <Label htmlFor="login-email">{t('login.emailLabel')}</Label>
            <Input
              id="login-email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              error={!!fieldErrors.email}
              autoComplete="email"
              spellCheck={false}
            />
            <FieldError message={fieldErrors.email} />
          </div>
          <div className="flex flex-col gap-1.5 stagger-2">
            <Label htmlFor="login-password">{t('login.passwordLabel')}</Label>
            <Input
              id="login-password"
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              error={!!fieldErrors.password}
              autoComplete="current-password"
            />
            <FieldError message={fieldErrors.password} />
            <Link
              to="/forgot-password"
              className="text-sm text-accent-primary hover:text-accent-secondary transition-colors self-end"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <Button className="w-full stagger-3" size="lg" type="submit" disabled={loading}>
            {loading ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>

        <div className="text-center mt-7 text-text-secondary text-sm stagger-4">
          {t('login.noAccount')}{' '}
          <Link
            to="/register"
            className="text-accent-primary hover:text-accent-secondary transition-colors"
          >
            {t('login.createOne')}
          </Link>
        </div>
      </div>
    </div>
  );
}
