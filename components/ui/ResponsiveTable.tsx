/**
 * ResponsiveTable Component
 * Wraps tables with horizontal scroll for mobile devices
 */

"use client";

import type { ReactNode } from "react";

export interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className = "" }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ResponsiveTableContainer - Full width responsive container for tables
 */
export interface ResponsiveTableContainerProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableContainer({ children, className = "" }: ResponsiveTableContainerProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  );
}

export default ResponsiveTable;
