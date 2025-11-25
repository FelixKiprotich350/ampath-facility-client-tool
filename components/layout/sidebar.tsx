"use client";

import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { id: "home", label: "Dashboard", icon: "🏠" },
    { id: "pending", label: "Pending Data", icon: "⏳" },
    { id: "history", label: "History", icon: "📜" },
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
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
