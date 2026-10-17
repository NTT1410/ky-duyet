"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export function Navbar() {
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
    <nav className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <Link href="/" className="font-heading font-bold text-xl text-slate-900 tracking-tight">
            E-Approval
          </Link>
        </div>

        {/* Right: Menu & Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
            <Link href="/" className="hover:text-blue-600 transition-colors">Tờ trình của tôi</Link>
            <Link href="/" className="hover:text-blue-600 transition-colors">Báo cáo</Link>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          {currentUser ? (
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
          ) : (
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Đăng nhập</Link>
          )}
        </div>
        
      </div>
    </nav>
  );
}
