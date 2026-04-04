import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger-ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'font-bold border-none cursor-pointer bg-accent-primary text-bg-primary shadow-sm hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0',
  secondary:
    'font-semibold border border-border bg-bg-card text-text-primary hover:-translate-y-px hover:bg-bg-card-hover hover:border-border-light',
  ghost:
    'font-semibold bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
  'danger-ghost':
    'font-semibold bg-transparent text-accent-danger hover:text-accent-danger/80 hover:bg-white/5',
  danger:
    'font-bold border-none cursor-pointer bg-accent-danger text-white shadow-sm hover:-translate-y-0.5 hover:bg-accent-danger/90 active:translate-y-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[0.813rem]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base rounded-md',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-sm font-display transition-all whitespace-nowrap tracking-tight disabled:opacity-45 disabled:cursor-not-allowed';

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, type ButtonProps };
