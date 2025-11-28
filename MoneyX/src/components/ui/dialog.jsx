import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="relative z-50 w-full animate-slide-in">
        {children}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef(
  ({ className, children, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base styles
        "relative bg-background shadow-lg w-full",
        // Mobile: Full height with rounded top, scrollable
        "max-h-[95vh] sm:max-h-[90vh]",
        "rounded-t-3xl sm:rounded-2xl",
        // Desktop: Max width and centered
        "sm:max-w-lg mx-auto",
        // Scrolling
        "flex flex-col",
        className
      )}
      {...props}
    >
      {/* Close button - Fixed position */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full p-1.5 bg-background hover:bg-accent transition-colors shadow-sm"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Scrollable content */}
      <div className="overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  )
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 p-4 sm:p-6 pb-3 sm:pb-4 pr-12", // Extra right padding for close button
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg sm:text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-4 sm:p-6 pt-3 sm:pt-4",
      "sticky bottom-0 bg-background border-t sm:border-t-0", // Sticky footer on mobile
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};