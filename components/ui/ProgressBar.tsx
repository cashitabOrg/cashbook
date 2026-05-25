import React from "react";

interface ProgressBarProps {
  progress: number;
  colorClass?: string;
  backgroundClass?: string;
  className?: string;
}

export function ProgressBar({ 
  progress, 
  colorClass = "bg-green-500", 
  backgroundClass = "bg-gray-200 dark:bg-[#333336]",
  className = "" 
}: ProgressBarProps) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`w-full h-2 rounded-full overflow-hidden ${backgroundClass} ${className}`}>
      <div 
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}
