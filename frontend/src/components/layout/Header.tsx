"use client";

import { useEffect, useState } from "react";
import { getCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = getCookie("auth_token") as string;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (e) {
        // invalid token
      }
    }
  }, []);

  const handleLogout = () => {
    deleteCookie("auth_token");
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-10 shadow-sm">
      {/* Nút menu cho mobile (hiện tại ẩn trên desktop) */}
      <div className="flex items-center md:hidden">
        <span className="font-heading font-bold text-lg text-slate-900">E-Approval</span>
      </div>
      
      <div className="hidden md:block">
        {/* Có thể để breadcrumb hoặc title ở đây */}
      </div>

      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 leading-none">{currentUser.fullName || currentUser.email}</p>
              <p className="text-xs text-slate-500 mt-1 leading-none">{currentUser.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              {currentUser.email?.charAt(0).toUpperCase()}
            </div>
            <button 
              onClick={handleLogout} 
              className="ml-1 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Đăng xuất"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
