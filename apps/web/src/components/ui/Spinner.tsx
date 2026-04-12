interface SpinnerProps {
  className?: string;
  fullPage?: boolean;
}

function Spinner({ className, fullPage = true }: SpinnerProps) {
  const spinner = (
    <div role="status" aria-label="Loading">
      <div
        className={`w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin ${className ?? ''}`}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );

  if (fullPage) {
    return <div className="flex items-center justify-center min-h-[50vh]">{spinner}</div>;
  }

  return spinner;
}

export { Spinner, type SpinnerProps };
