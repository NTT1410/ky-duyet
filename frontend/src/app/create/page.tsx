"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { API_URL, getAuthHeaders } from "@/lib/api";

export default function CreateDocumentPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Document Types from API
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>("");

  // Dynamic fields for "Thanh toán"
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [selectedApprover, setSelectedApprover] = useState("auto"); // "auto" hoặc ID của người duyệt

  // Quản lý danh sách file đính kèm
  const [files, setFiles] = useState<File[]>([]);

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

    // 1. Load danh sách người dùng để trình duyệt
    fetch(`${API_URL}/api/v1/users`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.data);
      })
      .catch(err => console.error("Lỗi fetch users", err));

    // 2. Load danh sách loại văn bản từ API
    fetch(`${API_URL}/api/v1/document-types`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setDocTypes(data.data);
          setSelectedDocTypeId(data.data[0].id);
        }
      })
      .catch(err => console.error("Lỗi fetch document-types", err));
  }, [router]);

  const selectedDocType = docTypes.find(t => t.id === selectedDocTypeId);
  const isPaymentType = selectedDocType?.code === 'TTCP' || selectedDocType?.name?.toLowerCase().includes('thanh toán');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      e.target.value = ""; // reset input
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);

    const formElement = e.currentTarget;
    const formDataNative = new FormData(formElement);
    const title = formDataNative.get("title") as string;
    const content = formDataNative.get("content") as string;

    const postData = new FormData();
    postData.append("title", title);
    postData.append("content", content || "");
    postData.append("documentTypeId", selectedDocTypeId);
    postData.append("creatorId", currentUser.id);

    if (selectedApprover !== "auto") {
      postData.append("selectedApproverId", selectedApprover);
    }

    if (isPaymentType) {
      postData.append("metadata", JSON.stringify({ amount, bankAccount }));
    }

    // Đính kèm các file thật
    files.forEach((file) => {
      postData.append("files", file);
    });

    try {
      const res = await fetch(`${API_URL}/api/v1/documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: postData,
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success("Tạo văn bản thành công!", {
          description: files.length > 0 
            ? `Đã tải lên ${files.length} tệp đính kèm và kích hoạt luồng phê duyệt.`
            : "Luồng duyệt đã tự động được kích hoạt.",
        });
        router.push("/documents");
      } else {
        toast.error("Tạo thất bại", { description: data.message });
      }
    } catch {
      toast.error("Lỗi kết nối", { description: "Không thể kết nối tới Backend API." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-5xl space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/documents">
            <Button variant="outline" className="text-slate-600 shadow-sm border-slate-200 hover:bg-slate-100">
              &larr; Quay lại danh sách
            </Button>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-slate-900">
            Tạo văn bản & Tờ trình mới
          </h1>
          <div className="w-[100px]"></div> {/* Spacer */}
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-white border-b border-slate-100">
              <CardTitle className="font-heading text-xl">Thông tin chung</CardTitle>
              <CardDescription>
                Điền các thông tin cần thiết để khởi tạo luồng trình duyệt hoặc giao nhiệm vụ trong công ty.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-medium">Tiêu đề văn bản <span className="text-red-500">*</span></Label>
                <Input 
                  name="title" 
                  id="title" 
                  required 
                  placeholder="VD: Đề nghị thanh toán công tác phí Đà Nẵng tháng 10/2026..." 
                  className="bg-slate-50 focus-visible:ring-blue-600" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Loại văn bản <span className="text-red-500">*</span></Label>
                  <Select value={selectedDocTypeId} onValueChange={(val) => setSelectedDocTypeId(val || "")}>
                    <SelectTrigger className="bg-slate-50 focus:ring-blue-600">
                      <SelectValue placeholder="-- Chọn loại văn bản --">
                        {(val) => docTypes.find(t => t.id === val)?.name || "-- Chọn loại văn bản --"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {docTypes.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Trình cho ai? <span className="text-slate-400 font-normal">(Tuỳ chọn)</span></Label>
                  <Select value={selectedApprover} onValueChange={(val) => setSelectedApprover(val || "auto")}>
                    <SelectTrigger className="bg-slate-50 focus:ring-blue-600">
                      <SelectValue placeholder="Theo luồng mặc định">
                        {(val) => {
                          if (val === "auto") return "✨ Chạy luồng tự động (Đa cấp)";
                          const u = users.find(user => user.id === val);
                          return u ? `${u.fullName} (${u.role})` : "Theo luồng mặc định";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <span className="text-blue-600 font-medium">✨ Chạy luồng tự động (Đa cấp)</span>
                      </SelectItem>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.fullName} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Độ khẩn</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger className="bg-slate-50 focus:ring-blue-600">
                      <SelectValue placeholder="Mức độ">
                        {(val) => val === "high" ? "Hỏa tốc / Khẩn" : "Bình thường"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Bình thường</SelectItem>
                      <SelectItem value="high">Hỏa tốc / Khẩn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Metadata Fields */}
              {isPaymentType && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-medium">Số tiền đề nghị (VNĐ) <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      required 
                      placeholder="VD: 5000000" 
                      className="bg-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-medium">Số tài khoản nhận tiền <span className="text-red-500">*</span></Label>
                    <Input 
                      value={bankAccount} 
                      onChange={(e) => setBankAccount(e.target.value)} 
                      required 
                      placeholder="VD: 0123456789 - Vietcombank (Nguyễn Văn Dev)" 
                      className="bg-white" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-700 font-medium">Nội dung chi tiết</Label>
                <Textarea 
                  name="content"
                  id="content" 
                  placeholder="Trình bày chi tiết lý do, mục đích, bối cảnh triển khai công việc..." 
                  className="min-h-[140px] bg-slate-50 focus-visible:ring-blue-600 resize-none" 
                />
              </div>

              {/* File đính kèm thật */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="file" className="text-slate-700 font-medium">
                    Tài liệu đính kèm (Chứng từ, Hóa đơn, Ảnh, PDF, Word, Excel...)
                  </Label>
                  <span className="text-xs text-slate-400">Tối đa 10 tệp, 25MB/tệp</span>
                </div>

                <div className="flex items-center gap-3">
                  <Input 
                    id="file" 
                    type="file" 
                    multiple 
                    onChange={handleFileChange}
                    className="cursor-pointer file:text-blue-600 file:bg-blue-50 file:border-0 file:rounded-md file:mr-4 file:px-4 file:-ml-2 file:font-medium hover:file:bg-blue-100" 
                  />
                </div>
                
                {/* Hiển thị danh sách file đã chọn */}
                {files.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                          <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                          <span className="text-xs text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Xóa tệp"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
            <CardFooter className="bg-slate-50/50 p-6 flex items-center justify-end gap-3 border-t border-slate-100 rounded-b-lg">
              <Link href="/documents">
                <Button type="button" variant="outline" className="px-6 border-slate-300">Hủy</Button>
              </Link>
              <Button type="submit" disabled={loading} className="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                {loading ? "Đang tải tệp & xử lý..." : "Gửi & Kích hoạt luồng duyệt"}
              </Button>
            </CardFooter>
          </Card>
        </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
