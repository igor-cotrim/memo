import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-10 animate-fade-slide-up">
      <div>
        <h1 className="font-display text-[1.85rem] font-extrabold tracking-tight text-balance">
          {title}
        </h1>
        {subtitle && <p className="text-text-secondary text-[0.9375rem] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export { PageHeader, type PageHeaderProps };
