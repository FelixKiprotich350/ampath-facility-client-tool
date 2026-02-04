"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/generate", label: "Generate", icon: "⏳" },
    { href: "/staged", label: "Staged Indicators", icon: "⏳" },
    // { href: "/reports", label: "Reports", icon: "📜" },
    { href: "/history", label: "History", icon: "📜" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🏥</span>
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
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
