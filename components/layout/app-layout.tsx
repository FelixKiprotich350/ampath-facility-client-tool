"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}