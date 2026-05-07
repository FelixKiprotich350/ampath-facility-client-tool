"use client";

import { Sidebar } from "@/components/layout/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function Provider({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main>{children}</main>
      </div>
    </div>
  );
}
