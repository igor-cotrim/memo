import { type HTMLAttributes } from 'react';

type AlertVariant = 'danger' | 'success';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant: AlertVariant;
}

const variantClasses: Record<AlertVariant, string> = {
  danger: 'text-accent-danger bg-accent-danger/10 border border-accent-danger/40',
  success: 'text-accent-success bg-accent-success/10 border border-accent-success/40',
};

function Alert({ variant, className, ...props }: AlertProps) {
  return (
    <div
      className={`text-[0.813rem] font-medium px-3 py-2.5 rounded-sm ${variantClasses[variant]} ${className ?? ''}`}
      role={variant === 'danger' ? 'alert' : 'status'}
      {...props}
    />
  );
}

export { Alert, type AlertProps };
