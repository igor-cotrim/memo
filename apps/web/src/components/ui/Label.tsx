import { type LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

const labelClasses =
  'font-display text-xs font-semibold text-text-secondary uppercase tracking-widest';

function Label({ className, ...props }: LabelProps) {
  return <label className={`${labelClasses} ${className ?? ''}`} {...props} />;
}

export { Label, type LabelProps };
