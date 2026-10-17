"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import { getCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { API_URL, getAuthHeaders } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getCookie("auth_token") as string;
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setCurrentUser(decoded);
    } catch {
      deleteCookie("auth_token");
      router.push("/login");
    }
  }, [router]);

  const fetchPendingDocs = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/documents/pending/${userId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tải danh sách tờ trình");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchPendingDocs(currentUser.id);
    }
  }, [currentUser, fetchPendingDocs]);

  const handleQuickApprove = async (approvalId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_URL}/api/v1/documents/approve/${approvalId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId: currentUser.id,
          action,
          comment: action === 'APPROVED' ? "Đã duyệt nhanh" : "Từ chối"
        }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(action === 'APPROVED' ? "Đã phê duyệt!" : "Đã từ chối!");
        fetchPendingDocs(currentUser.id); // Reload list
      } else {
        toast.error("Lỗi xử lý", { description: data.message });
      }
    } catch {
      toast.error("Lỗi hệ thống");
    }
  };

  if (!currentUser) return null; // Avoid hydration flash

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="w-full max-w-[1400px] mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                Hàng đợi Phê duyệt của tôi
              </h1>
              <p className="text-slate-500 mt-1">
                Các văn bản và tờ trình đang chờ bạn xem xét, ký duyệt
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/documents">
                <Button variant="outline" className="border-slate-300">
                  Tra cứu văn bản
                </Button>
              </Link>
              <Link href="/create">
                <Button size="lg" className="font-medium shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
                  + Tạo Văn bản mới
                </Button>
              </Link>
            </div>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Đang chờ tôi duyệt</CardDescription>
              <CardTitle className="text-4xl text-amber-600 font-heading">{documents.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Vai trò đăng nhập</CardDescription>
              <CardTitle className="text-2xl text-slate-800 font-heading">{currentUser.role || "EMPLOYEE"}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Văn bản cần xử lý gấp</CardDescription>
              <CardTitle className="text-4xl text-blue-600 font-heading">
                {documents.filter(d => d.document?.title?.toLowerCase().includes("khẩn")).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* List */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">Danh sách cần xử lý ({documents.length})</CardTitle>
              <CardDescription>Bấm &quot;Xem & Ký duyệt&quot; để kiểm tra nội dung và hồ sơ đính kèm trước khi phê duyệt.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => currentUser?.id && fetchPendingDocs(currentUser.id)}>
              Làm mới
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {loading ? (
              <p className="text-center text-slate-500 py-8">Đang tải danh sách...</p>
            ) : documents.length === 0 ? (
              <div className="text-center text-slate-500 py-12 border-2 border-dashed rounded-lg border-slate-200 space-y-2">
                <p className="text-base font-medium text-slate-700">Không có tờ trình nào đang chờ bạn duyệt! 🎉</p>
                <p className="text-xs text-slate-400">Bạn đã hoàn thành tất cả các nhiệm vụ phê duyệt được giao.</p>
              </div>
            ) : (
              documents.map((appr) => (
                <div key={appr.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {appr.document.documentType?.name}
                      </span>
                      {appr.document.attachments && appr.document.attachments.length > 0 && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          📎 {appr.document.attachments.length} tệp đính kèm
                        </span>
                      )}
                    </div>

                    <Link href={`/documents/${appr.document.id}`}>
                      <h3 className="font-semibold text-slate-900 text-lg hover:text-blue-600 transition-colors">
                        {appr.document.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-500">
                      Người gửi: <span className="font-medium text-slate-700">{appr.document.creator.fullName}</span> ({appr.document.creator.email}) • Ngày gửi: {new Date(appr.document.createdAt).toLocaleString('vi-VN')}
                    </p>

                    {appr.document.metadata && appr.document.metadata.amount && (
                      <p className="text-xs text-blue-700 bg-blue-50/70 border border-blue-200 px-2.5 py-1 rounded inline-block mt-1 font-semibold">
                        Số tiền đề nghị: {Number(appr.document.metadata.amount).toLocaleString('vi-VN')} VNĐ
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                      Chờ bạn xử lý
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Link href={`/documents/${appr.document.id}`}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm"
                        >
                          Xem chi tiết &rarr;
                        </Button>
                      </Link>

                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleQuickApprove(appr.id, 'REJECTED')}
                      >
                        Từ chối
                      </Button>

                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        onClick={() => handleQuickApprove(appr.id, 'APPROVED')}
                      >
                        Duyệt nhanh
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
    </DashboardLayout>
  );
}
