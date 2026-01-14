/**
 * DashboardLayout Component
 * Provides responsive layout with navigation for dashboard pages
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./MobileNav";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const navItems = [
  { href: "/", icon: "📊", label: "Dashboard", desc: "Home page overview" },
  { href: "/agents", icon: "👥", label: "Agents", desc: "Agent monitoring" },
  { href: "/swarms", icon: "🐝", label: "Swarms", desc: "Swarm status" },
  { href: "/tasks", icon: "📋", label: "Tasks", desc: "Task tracking" },
  { href: "/messages", icon: "💬", label: "Messages", desc: "Communication" },
  { href: "/metrics", icon: "📈", label: "Metrics", desc: "Performance data" },
  { href: "/performance-metrics", icon: "⚡", label: "Performance", desc: "Agent metrics" },
  { href: "/patterns", icon: "🔮", label: "Patterns", desc: "Discovered patterns" },
  { href: "/trajectories", icon: "🛤️", label: "Trajectories", desc: "Task paths" },
  { href: "/queries", icon: "🔍", label: "Queries", desc: "Query tracking" },
  { href: "/alerts", icon: "🔔", label: "Alerts", desc: "Alert management" },
  { href: "/cost", icon: "💰", label: "Cost", desc: "Cost optimization" },
  { href: "/comparison", icon: "🔄", label: "Compare", desc: "Swarm comparison" },
  { href: "/predictions", icon: "🧠", label: "Predictions", desc: "AI failure detection" },
  { href: "/status", icon: "🔴", label: "Status", desc: "System health" },
  { href: "/settings", icon: "⚙️", label: "Settings", desc: "Configuration" },
];

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (title) {
      document.title = `${title} - Claude Code Monitoring`;
    }
  }, [title]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Navigation */}
      <MobileNav items={navItems} />

      {/* Desktop Header - Hidden on Mobile */}
      <header className="hidden lg:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📊</span>
                <span>Claude Code Monitor</span>
              </Link>
              <nav className="hidden md:block">
                <ul className="flex items-center gap-1">
                  {navItems.slice(0, 8).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                            isActive
                              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          <span className="mr-1">{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pt-4">
        {/* Page Header - Mobile Optimized */}
        {(title || description) && (
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 lg:px-6 lg:py-6">
            <div className="container mx-auto">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-1 lg:mb-2">
                {title}
              </h1>
              {description && (
                <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Content with proper mobile padding */}
        <div className="container mx-auto px-4 py-4 lg:px-4 lg:py-6 pb-20 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
