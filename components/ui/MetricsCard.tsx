/**
 * MetricsCard Component
 * Displays a single metric with trend indicator
 */

import React from "react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MetricsCard({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  size = "md",
  className = "",
}: MetricsCardProps) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const valueSizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  const changeColors = {
    positive: "text-green-600 dark:text-green-400",
    negative: "text-red-600 dark:text-red-400",
    neutral: "text-slate-600 dark:text-slate-400",
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${sizeClasses[size]} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        {change && (
          <span
            className={`text-sm font-medium ${changeColors[changeType]} flex items-center gap-1`}
          >
            {changeType === "positive" && "↑"}
            {changeType === "negative" && "↓"}
            {change}
          </span>
        )}
      </div>
      <div
        className={`font-bold text-slate-900 dark:text-white mb-1 ${valueSizeClasses[size]}`}
      >
        {value}
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
    </div>
  );
}
