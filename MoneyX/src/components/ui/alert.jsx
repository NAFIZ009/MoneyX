import * as React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Alert = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    const icons = {
      default: Info,
      destructive: XCircle,
      success: CheckCircle,
      warning: AlertCircle,
    };

    const Icon = icons[variant] || icons.default;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4 flex items-start gap-3",
          {
            "bg-background text-foreground": variant === "default",
            "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive":
              variant === "destructive",
            "border-green-500/50 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400":
              variant === "success",
            "border-yellow-500/50 text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400":
              variant === "warning",
          },
          className
        )}
        {...props}
      >
        <Icon className="h-5 w-5 mt-0.5" />
        <div className="flex-1">{props.children}</div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };