import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button, Input, Label, Alert, FieldError } from '../components/ui';
import { useLocale } from '../hooks/useLocale';
import { useFormValidation } from '../hooks/useFormValidation';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../utils/error';

export default function ResetPasswordPage() {
  const { t, localeLabel, toggleLocale } = useLocale();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    errors: fieldErrors,
    validate,
    clearFieldError,
  } = useFormValidation(
    {
      newPassword: { required: true, minLength: 6 },
      confirmPassword: {
        required: true,
        minLength: 6,
        custom: (val, fields) =>
          val !== fields.newPassword ? t('validation.passwordMismatch') : null,
      },
    },
    t,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate({ newPassword, confirmPassword })) return;
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('resetPassword.failed')));
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
          {t('resetPassword.title')}
        </h1>
        <p className="text-center text-text-secondary text-[0.9375rem] mb-8">
          {t('resetPassword.subtitle')}
        </p>

        {success ? (
          <Alert variant="success">{t('resetPassword.success')}</Alert>
        ) : (
          <>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              {error && <Alert variant="danger">{error}</Alert>}
              <div className="flex flex-col gap-1.5 stagger-1">
                <Label htmlFor="reset-new-password">{t('resetPassword.newPasswordLabel')}</Label>
                <Input
                  id="reset-new-password"
                  type="password"
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearFieldError('newPassword');
                  }}
                  error={!!fieldErrors.newPassword}
                  autoComplete="new-password"
                />
                <FieldError message={fieldErrors.newPassword} />
              </div>
              <div className="flex flex-col gap-1.5 stagger-2">
                <Label htmlFor="reset-confirm-password">
                  {t('resetPassword.confirmPasswordLabel')}
                </Label>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  error={!!fieldErrors.confirmPassword}
                  autoComplete="new-password"
                />
                <FieldError message={fieldErrors.confirmPassword} />
              </div>
              <Button className="w-full stagger-3" size="lg" type="submit" disabled={loading}>
                {loading ? t('resetPassword.submitting') : t('resetPassword.submit')}
              </Button>
            </form>

            <div className="text-center mt-7 text-text-secondary text-sm stagger-4">
              <Link
                to="/login"
                className="text-accent-primary hover:text-accent-secondary transition-colors"
              >
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
