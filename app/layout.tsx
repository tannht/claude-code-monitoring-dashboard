import type { Metadata } from "next";
import "./globals.css";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Claude Code Monitoring Dashboard",
  description: "Real-time monitoring for Claude Code agents, swarms, and tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <MantineProvider defaultColorScheme="auto">
            {children}
          </MantineProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
