interface SpinnerProps {
  className?: string;
  fullPage?: boolean;
}

function Spinner({ className, fullPage = true }: SpinnerProps) {
  const spinner = (
    <div
      className={`w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin ${className ?? ""}`}
    />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export { Spinner, type SpinnerProps };
