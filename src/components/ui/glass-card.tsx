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
        "glass-card p-6",
        hover && "hover:scale-[1.02] hover:shadow-2xl transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
