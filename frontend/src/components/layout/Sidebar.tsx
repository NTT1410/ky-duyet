"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopVersion, setDesktopVersion] = useState("1.0.0");
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.isDesktop) {
      setIsDesktop(true);
      if ((window as any).electronAPI.getVersion) {
        (window as any).electronAPI.getVersion().then((v: string) => {
          setDesktopVersion(v || "1.0.0");
        });
      }
    }
  }, []);

  const handleCheckUpdate = async () => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.checkUpdate) {
      setCheckingUpdate(true);
      try {
        await (window as any).electronAPI.checkUpdate(true);
      } finally {
        setCheckingUpdate(false);
      }
    }
  };

  const links = [
    { name: "Trang chủ", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Tạo tờ trình", href: "/create", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { name: "Toàn bộ văn bản", href: "/documents", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <span className="font-heading font-bold text-xl text-white tracking-tight">E-Approval</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu chính</div>
        {links.map((link) => {
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link key={link.name} href={link.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}></path>
                </svg>
                <span className="font-medium text-sm">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop App Status & Auto-Update Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        {isDesktop ? (
          <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700/70 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Bản Desktop PC
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                v{desktopVersion}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Hỗ trợ ký USB Token (PKCS#11)
            </p>
            <button
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              className="w-full text-center py-1.5 px-2 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-medium text-slate-100 transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>{checkingUpdate ? "Đang kiểm tra..." : "🔄 Kiểm tra cập nhật"}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>💻</span> Bản Desktop
              </span>
              <span className="text-[10px] bg-blue-950/70 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/50">
                Windows
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Cần ký bằng thiết bị USB Token phần cứng?
            </p>
            <a
              href="https://github.com/NTT1410/ky-duyet/releases/latest"
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center py-1.5 px-2 rounded bg-blue-600/90 hover:bg-blue-600 text-[11px] font-medium text-white transition-colors"
            >
              📥 Tải ứng dụng PC
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
