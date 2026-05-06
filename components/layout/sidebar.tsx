"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Database, History, Hospital } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/generate", label: "Generate", icon: ClipboardList },
    { href: "/staged", label: "Staged Indicators", icon: Database },
    // { href: "/reports", label: "Reports", icon: FileText },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Hospital className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Facility Client</h2>
            <p className="text-xs text-gray-500">Data Collection Tool</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === item.href
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
