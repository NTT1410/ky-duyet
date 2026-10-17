"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { API_URL, getAuthHeaders } from "@/lib/api";

export default function DocumentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (status !== "ALL") params.append("status", status);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const url = `${API_URL}/api/v1/documents?${params.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      } else {
        toast.error("Lỗi khi tải danh sách", { description: data.message });
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  }, [search, status, fromDate, toDate]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchDocs();
    }
  }, [currentUser, fetchDocs]);

  const resetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setFromDate("");
    setToDate("");
  };

  const setFilterOct8 = () => {
    setFromDate("2026-10-08");
    setToDate("2026-10-08");
  };

  const getStatusBadge = (docStatus: string) => {
    switch (docStatus) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Đang chờ duyệt</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã phê duyệt</Badge>;
      case "REJECTED":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Đã từ chối</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">{docStatus}</Badge>;
    }
  };

  if (!currentUser) return null;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="w-full max-w-[1400px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                Toàn bộ Văn bản & Tờ trình
              </h1>
              <p className="text-slate-500 mt-1">
                Quản lý, theo dõi tiến độ và tra cứu lịch sử văn bản trong toàn công ty
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/create">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
                  + Tạo văn bản mới
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-heading text-slate-800">Bộ lọc tra cứu</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={setFilterOct8}
                    className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    📅 Lọc ngày 08/10/2026
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-xs h-8 text-slate-500 hover:text-slate-900"
                  >
                    Đặt lại
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Tìm kiếm từ khóa</Label>
                <Input 
                  placeholder="Tiêu đề hoặc nội dung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50 text-sm h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Trạng thái duyệt</Label>
                <Select value={status} onValueChange={(val) => setStatus(val || "ALL")}>
                  <SelectTrigger className="bg-slate-50 text-sm h-9">
                    <SelectValue placeholder="Tất cả trạng thái">
                      {(val) => {
                        switch (val) {
                          case "PENDING": return "Đang chờ duyệt";
                          case "COMPLETED": return "Đã phê duyệt";
                          case "REJECTED": return "Đã từ chối";
                          default: return "Tất cả trạng thái";
                        }
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="PENDING">Đang chờ duyệt</SelectItem>
                    <SelectItem value="COMPLETED">Đã phê duyệt</SelectItem>
                    <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Từ ngày</Label>
                <Input 
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-50 text-sm h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Đến ngày</Label>
                <Input 
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-50 text-sm h-9"
                />
              </div>

            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="font-heading text-lg">Danh sách văn bản</CardTitle>
                <CardDescription>
                  Tìm thấy <span className="font-semibold text-slate-900">{documents.length}</span> văn bản phù hợp
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchDocs} className="h-8">
                Làm mới
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center text-slate-500 py-12">Đang tải danh sách văn bản...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <p className="font-medium text-slate-700">Không tìm thấy văn bản nào phù hợp với bộ lọc!</p>
                  <p className="text-xs text-slate-400">Hãy thử xóa bộ lọc ngày hoặc từ khóa tìm kiếm.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70">
                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Tiêu đề & Thông tin</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Người tạo</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại văn bản</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Đính kèm</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Ngày tạo</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                            <Link 
                              href={`/documents/${doc.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block line-clamp-1"
                            >
                              {doc.title}
                            </Link>
                            {doc.metadata?.amount && (
                              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded mt-1 inline-block">
                                {Number(doc.metadata.amount).toLocaleString("vi-VN")} VNĐ
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-medium">{doc.creator.fullName}</div>
                            <div className="text-xs text-slate-400">{doc.creator.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {doc.documentType.name}
                          </td>
                          <td className="py-3.5 px-4">
                            {doc.attachments && doc.attachments.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                📎 {doc.attachments.length} tệp
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">0 tệp</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">
                            {new Date(doc.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(doc.status)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/documents/${doc.id}`}>
                              <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                                Xem chi tiết &rarr;
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
