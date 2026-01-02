"use client";

import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

export type HeaderProps = {
  title?: string;
  onMenuClick?: () => void;
};

export default function Header({ title, onMenuClick }: HeaderProps) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);
      setCurrentDate(formatted);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 shadow-md flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} className="text-gray-600" />
        </button>

        {/* Page title (optional) */}
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{title}</h1>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Current Date */}
        <div className="text-sm text-gray-600 font-medium">
          {currentDate}
        </div>
      </div>
    </header>
  );
}

