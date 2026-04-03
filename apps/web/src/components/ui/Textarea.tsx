import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const textareaClasses =
  "bg-bg-input border border-border rounded-sm px-4 py-3 text-text-primary font-body text-[0.9375rem] transition shadow-none focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10 w-full min-h-[80px] resize-y";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`${textareaClasses} ${error ? "border-accent-danger" : ""} ${className ?? ""}`}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, type TextareaProps };
