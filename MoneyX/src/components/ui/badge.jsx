import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          {
            "border-transparent bg-primary text-primary-foreground":
              variant === "default",
            "border-transparent bg-secondary text-secondary-foreground":
              variant === "secondary",
            "border-transparent bg-destructive text-destructive-foreground":
              variant === "destructive",
            "text-foreground": variant === "outline",
            "border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400":
              variant === "success",
            "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400":
              variant === "warning",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };