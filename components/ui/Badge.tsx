import React from "react";

type BadgeVariant = "urgent" | "low_priority" | "completed" | "in_progress" | "critical";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = "completed", children, className = "", ...props }: BadgeProps) {
  const baseStyles = "px-3 py-1 rounded-md text-xs font-medium border text-center";
  
  const variants = {
    urgent: "bg-red-500/10 text-red-500 border-red-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
    low_priority: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
