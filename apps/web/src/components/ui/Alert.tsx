import { type HTMLAttributes } from "react";

type AlertVariant = "danger" | "success";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant: AlertVariant;
}

const variantClasses: Record<AlertVariant, string> = {
  danger: "text-accent-danger bg-accent-danger/10 border-accent-danger",
  success: "text-accent-success bg-accent-success/10 border-accent-success",
};

function Alert({ variant, className, ...props }: AlertProps) {
  return (
    <div
      className={`text-[0.813rem] font-medium px-3 py-2 rounded-sm border-l-[3px] ${variantClasses[variant]} ${className ?? ""}`}
      role={variant === "danger" ? "alert" : "status"}
      {...props}
    />
  );
}

export { Alert, type AlertProps };
