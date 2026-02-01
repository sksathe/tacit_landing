"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function DashboardHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-avatar-container")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (confirm("Are you sure you want to logout?")) {
      // Handle logout
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-[rgba(10,10,10,0.95)] backdrop-blur-[10px] border-b border-[rgba(16,185,129,0.2)] px-8 py-6 sticky top-0 z-[1000]">
      <nav className="max-w-[1600px] mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 text-[1.8rem] font-extrabold text-[#10b981]">
          <span className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="12" cy="10" r="2.5" fill="#10b981"/>
              <circle cx="8" cy="20" r="2.5" fill="#10b981"/>
              <circle cx="12" cy="30" r="2.5" fill="#10b981"/>
              <circle cx="28" cy="10" r="2.5" fill="#10b981"/>
              <circle cx="32" cy="20" r="2.5" fill="#10b981"/>
              <circle cx="28" cy="30" r="2.5" fill="#10b981"/>
              <circle cx="20" cy="20" r="3" fill="#10b981"/>
              <line x1="12" y1="10" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="8" y1="20" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="30" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="28" y1="10" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="32" y1="20" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="28" y1="30" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M 12 10 Q 10 15 8 20" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M 8 20 Q 10 25 12 30" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M 28 10 Q 30 15 32 20" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <path d="M 32 20 Q 30 25 28 30" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
          <span>Tacit Studio</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[#a0a0a0] text-[0.95rem]">Welcome back!</span>
          <div className="relative user-avatar-container">
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-[45px] h-[45px] rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center font-bold text-[1.1rem] cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            >
              U
            </div>
            {isDropdownOpen && (
              <div className="absolute top-[55px] right-0 bg-[rgba(26,26,26,0.95)] border border-[rgba(16,185,129,0.3)] rounded-lg py-2 min-w-[150px] z-[1000] backdrop-blur-[10px]">
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-3 text-white text-[0.9rem] cursor-pointer transition-all hover:bg-[rgba(16,185,129,0.1)] hover:text-[#10b981] text-left border-none bg-transparent"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}


