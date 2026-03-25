import { ReactNode } from "react";

type EmptyStateProps = {
  icon: string | ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center py-20 px-4 sm:px-8 text-text-secondary animate-fade-slide-up">
      <div className="text-[3.5rem] sm:text-[4rem] mb-4 sm:mb-6">{icon}</div>
      <h2 className="font-display text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-text-primary tracking-tight">
        {title}
      </h2>
      <p className="mb-6 sm:mb-8 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
