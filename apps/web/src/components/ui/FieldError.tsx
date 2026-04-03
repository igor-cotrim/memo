function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-accent-danger text-xs mt-1" role="alert">
      {message}
    </p>
  );
}

export { FieldError };
