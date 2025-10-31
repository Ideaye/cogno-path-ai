import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  hover = true,
  ...props 
}: GlassCardProps) {
  return (
    <div 
      className={cn(
        "bg-white border border-black/[0.08] rounded-xl shadow-sm p-4",
        hover && "hover:shadow-md transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
