"use client";

import { useState, useEffect, use, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { API_URL, getAuthHeaders } from "@/lib/api";

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Action approval state
  const [comment, setComment] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [signMethod, setSignMethod] = useState<"VIETTEL_MYSIGN" | "CANVAS" | "STANDARD">("VIETTEL_MYSIGN");
  const [approverPhone, setApproverPhone] = useState("0988 123 456");

  // Viettel MySign Interactive Simulation State
  const [viettelStep, setViettelStep] = useState<number>(0); 
  // 0: idle, 1: connecting, 2: waiting phone biometric, 3: success

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Selected Cert Info to view modal
  const [activeCert, setActiveCert] = useState<any>(null);

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

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/documents/${docId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDocument(data.data);
      } else {
        toast.error("Không tìm thấy văn bản", { description: data.message });
      }
    } catch {
      toast.error("Lỗi khi tải thông tin văn bản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchDocument();
    }
  }, [docId]);

  // Canvas drawing methods
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1d4ed8"; // blue-700
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleApproveAction = async (action: "APPROVED" | "REJECTED") => {
    if (!pendingApprovalForMe) return;

    if (action === "REJECTED" && !comment.trim()) {
      toast.warning("Vui lòng nhập lý do từ chối vào ô nhận xét!");
      return;
    }

    // Xử lý luồng ký số Viettel MySign
    if (action === "APPROVED" && signMethod === "VIETTEL_MYSIGN") {
      setSubmittingAction(true);
      setViettelStep(1); // Bước 1: Kết nối Gateway

      await new Promise(r => setTimeout(r, 1200));
      setViettelStep(2); // Bước 2: Chờ Sếp quét FaceID trên điện thoại

      await new Promise(r => setTimeout(r, 2200));
      setViettelStep(3); // Bước 3: Xác thực sinh trắc học thành công
      await new Promise(r => setTimeout(r, 800));
    } else {
      setSubmittingAction(true);
    }

    try {
      let signatureImage: string | undefined = undefined;
      if (action === "APPROVED" && signMethod === "CANVAS" && canvasRef.current && hasSignature) {
        signatureImage = canvasRef.current.toDataURL("image/png");
      }

      const res = await fetch(`${API_URL}/api/v1/documents/approve/${pendingApprovalForMe.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId: currentUser.id,
          action,
          comment: comment.trim() || (action === "APPROVED" ? (signMethod === "VIETTEL_MYSIGN" ? "Đã ký số qua Viettel MySign" : "Đã đồng ý phê duyệt") : "Từ chối"),
          signType: action === "APPROVED" ? signMethod : undefined,
          signatureImage,
          approverPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(action === "APPROVED" ? "Phê duyệt & Ký số thành công!" : "Đã từ chối văn bản", {
          description: data.message,
        });
        setComment("");
        setViettelStep(0);
        clearCanvas();
        fetchDocument(); // Refresh document state & timeline
      } else {
        toast.error("Thao tác thất bại", { description: data.message });
        setViettelStep(0);
      }
    } catch {
      toast.error("Lỗi hệ thống khi gửi phê duyệt");
      setViettelStep(0);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Đang chờ duyệt</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã phê duyệt hoàn tất</Badge>;
      case "REJECTED":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Đã từ chối</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500">Đang tải thông tin văn bản...</div>
      </DashboardLayout>
    );
  }

  if (!document) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center space-y-4">
          <p className="text-slate-600 font-medium">Không tìm thấy thông tin văn bản hoặc văn bản đã bị xóa.</p>
          <Link href="/documents">
            <Button variant="outline">Quay lại danh sách</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const pendingApprovalForMe = document.approvals?.find(
    (appr: any) => appr.approverId === currentUser.id && appr.action === "PENDING"
  );

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        <div className="w-full max-w-5xl mx-auto space-y-6">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/documents">
                <Button variant="outline" size="sm" className="border-slate-300">
                  &larr; Danh sách
                </Button>
              </Link>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mã văn bản: {document.id.slice(0, 8)}
                </span>
                <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
                  {document.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 hidden sm:inline">Trạng thái:</span>
              {getStatusBadge(document.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Document Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Main Content Card */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-heading text-slate-900">
                        Nội dung trình duyệt
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Loại văn bản: <span className="font-medium text-slate-700">{document.documentType?.name}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-slate-300 text-slate-600">
                      Bước {document.currentStepOrder}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6 bg-white">
                  {/* Dynamic Metadata (e.g. Thanh toán) */}
                  {document.metadata && (
                    <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
                      <div className="text-xs font-semibold uppercase text-blue-900 tracking-wider">
                        Thông tin thanh toán / hoàn ứng
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {document.metadata.amount && (
                          <div>
                            <span className="text-xs text-slate-500 block">Số tiền đề nghị:</span>
                            <span className="text-xl font-bold text-blue-700">
                              {Number(document.metadata.amount).toLocaleString("vi-VN")} VNĐ
                            </span>
                          </div>
                        )}
                        {document.metadata.bankAccount && (
                          <div>
                            <span className="text-xs text-slate-500 block">Tài khoản nhận tiền:</span>
                            <span className="text-sm font-semibold text-slate-800">
                              {document.metadata.bankAccount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Document Body */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Chi tiết văn bản
                    </span>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap text-slate-800 text-sm leading-relaxed min-h-[120px]">
                      {document.content || "(Không có nội dung chi tiết)"}
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Tài liệu & Chứng từ đính kèm ({document.attachments?.length || 0})
                    </span>

                    {document.attachments?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Không có tài liệu đính kèm nào.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {document.attachments.map((att: any) => (
                          <div 
                            key={att.id}
                            className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-slate-800 truncate">
                                {att.fileName}
                              </span>
                            </div>

                            <a 
                              href={`${API_URL}${att.fileUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors shrink-0 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                              </svg>
                              Xem / Tải về
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Card: Advanced Digital Signature Area */}
              {pendingApprovalForMe && (
                <Card className="border-2 border-blue-600 shadow-md animate-in fade-in bg-white">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-blue-950 font-heading flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></span>
                        Phê duyệt & Ký số điện tử
                      </CardTitle>
                      <Badge className="bg-blue-600 text-white font-medium">Lượt của bạn</Badge>
                    </div>
                    <CardDescription className="text-blue-900/70">
                      Chọn phương thức ký xác thực số (Viettel MySign hoặc Ký tay điện tử) để hoàn tất phê duyệt văn bản.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-6">
                    
                    {/* Method Selector Tabs */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                        Phương thức ký số:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div 
                          onClick={() => setSignMethod("VIETTEL_MYSIGN")}
                          className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                            signMethod === "VIETTEL_MYSIGN" 
                              ? "border-red-500 bg-red-50/40 shadow-sm" 
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-md bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            VT
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                              Viettel MySign (Cloud CA)
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">Khuyên dùng</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">Ký số từ xa qua App điện thoại (FaceID / Vân tay)</p>
                          </div>
                        </div>

                        <div 
                          onClick={() => setSignMethod("CANVAS")}
                          className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${
                            signMethod === "CANVAS" 
                              ? "border-blue-600 bg-blue-50/40 shadow-sm" 
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            ✍️
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">Ký điện tử & Vẽ chữ ký tay</div>
                            <p className="text-xs text-slate-500 mt-0.5">Vẽ trực tiếp trên màn hình hoặc đóng dấu nội bộ</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Method 1: Viettel MySign Config */}
                    {signMethod === "VIETTEL_MYSIGN" && (
                      <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            Thông tin tài khoản Viettel MySign của bạn
                          </span>
                          <span className="text-[11px] text-red-700 font-medium">Chứng thư số cá nhân/DN</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-600">Số điện thoại đăng ký MySign:</label>
                            <Input 
                              value={approverPhone}
                              onChange={(e) => setApproverPhone(e.target.value)}
                              placeholder="0988xxxxxx"
                              className="bg-white text-sm font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-600">Trạng thái App Viettel:</label>
                            <div className="h-9 px-3 bg-white border border-slate-200 rounded-md flex items-center text-xs font-semibold text-emerald-700 gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Sẵn sàng nhận lệnh ký từ xa
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          Khi bạn bấm nút Ký, hệ thống sẽ đẩy thông báo trực tiếp đến App Viettel MySign trên điện thoại của bạn để quét FaceID/Vân tay.
                        </p>
                      </div>
                    )}

                    {/* Method 2: Handwritten Canvas */}
                    {signMethod === "CANVAS" && (
                      <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Vẽ chữ ký của bạn vào khung bên dưới:
                          </label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearCanvas}
                            className="text-xs h-7 text-slate-500 hover:text-red-600"
                          >
                            Xóa vẽ lại
                          </Button>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 bg-white rounded-md flex justify-center items-center overflow-hidden">
                          <canvas
                            ref={canvasRef}
                            width={500}
                            height={140}
                            className="cursor-crosshair w-full max-w-[500px] h-[140px] touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>
                        <p className="text-xs text-slate-400 text-center">
                          Dùng chuột hoặc chạm ngón tay để vẽ chữ ký
                        </p>
                      </div>
                    )}

                    {/* Comment Area */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Ý kiến chỉ đạo / Nhận xét / Lý do từ chối:
                      </label>
                      <Textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="VD: Đã duyệt kinh phí, yêu cầu nộp đầy đủ hóa đơn đỏ về phòng Kế toán..."
                        className="bg-slate-50 focus-visible:ring-blue-600 min-h-[80px]"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="bg-slate-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      disabled={submittingAction}
                      onClick={() => handleApproveAction("REJECTED")}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                    >
                      Từ chối văn bản
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button 
                        disabled={submittingAction}
                        onClick={() => handleApproveAction("APPROVED")}
                        className={`text-white shadow-md px-6 w-full sm:w-auto ${
                          signMethod === "VIETTEL_MYSIGN" 
                            ? "bg-red-600 hover:bg-red-700" 
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {submittingAction 
                          ? (signMethod === "VIETTEL_MYSIGN" ? "Đang xác thực Viettel..." : "Đang xử lý...")
                          : (signMethod === "VIETTEL_MYSIGN" ? "📱 Ký số qua Viettel MySign" : "✍️ Ký & Phê duyệt")}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )}

            </div>

            {/* Right 1 Col: Creator Info & Workflow Timeline */}
            <div className="space-y-6">
              
              {/* Creator Card */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                  <CardTitle className="text-sm font-heading text-slate-700 uppercase tracking-wider">
                    Thông tin người tạo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 bg-white text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Họ và tên:</span>
                    <span className="font-semibold text-slate-900">{document.creator?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Email:</span>
                    <span className="text-slate-600">{document.creator?.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Phòng ban:</span>
                    <span className="text-slate-600">{document.creator?.department?.name || "Chưa gán"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Thời gian tạo:</span>
                    <span className="text-slate-600">{new Date(document.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Timeline (Audit Trail) */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                  <CardTitle className="text-sm font-heading text-slate-700 uppercase tracking-wider">
                    Tiến trình & Chữ ký số
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 bg-white">
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
                    {document.approvals?.map((appr: any, idx: number) => {
                      const isApproved = appr.action === "APPROVED";
                      const isRejected = appr.action === "REJECTED";
                      const isPending = appr.action === "PENDING";
                      const isViettel = appr.signType === "VIETTEL_MYSIGN" || appr.certInfo?.provider === "VIETTEL_MYSIGN";

                      return (
                        <div key={appr.id} className="relative pl-6">
                          {/* Dot indicator */}
                          <div 
                            className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                              isApproved 
                                ? (isViettel ? "border-red-600 bg-red-50 text-red-600" : "border-emerald-500 bg-emerald-50 text-emerald-600")
                                : isRejected 
                                ? "border-red-500 bg-red-50 text-red-600" 
                                : "border-amber-500 bg-amber-50 text-amber-600"
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isApproved ? (isViettel ? "bg-red-600" : "bg-emerald-600") : isRejected ? "bg-red-600" : "bg-amber-500"
                            }`} />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase">
                                Bước {idx + 1}: {appr.approver?.fullName}
                              </span>
                              {isApproved && (
                                <Badge variant="secondary" className={`${isViettel ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"} text-[10px] px-1.5 py-0`}>
                                  {isViettel ? "Ký số Viettel-CA" : "Đã duyệt"}
                                </Badge>
                              )}
                              {isRejected && (
                                <Badge variant="secondary" className="bg-red-50 text-red-700 text-[10px] px-1.5 py-0 border-red-200">
                                  Từ chối
                                </Badge>
                              )}
                              {isPending && (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0 border-amber-200">
                                  Đang chờ
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-slate-500">
                              {appr.approver?.email} ({appr.approver?.department?.name || appr.approver?.role})
                            </p>

                            {appr.comment && (
                              <p className="text-xs bg-slate-50 border border-slate-100 p-2 rounded text-slate-700 italic">
                                &ldquo;{appr.comment}&rdquo;
                              </p>
                            )}

                            {/* Digital Signature Seal Display */}
                            {isApproved && isViettel && appr.certInfo && (
                              <div className="p-3 bg-red-50/70 border-2 border-red-500/80 rounded-md text-red-950 space-y-1.5 shadow-xs">
                                <div className="flex items-center justify-between border-b border-red-200 pb-1">
                                  <span className="text-[10px] font-bold tracking-wider text-red-700 uppercase flex items-center gap-1">
                                    🛡️ KÝ SỐ VIETTEL-CA (MYSIGN)
                                  </span>
                                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1 py-0.2 rounded">
                                    HỢP LỆ
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-red-900">
                                  Ký bởi: {appr.approver?.fullName}
                                </div>
                                <div className="text-[10px] text-slate-600 font-mono truncate">
                                  Cert: {appr.certInfo.serialNumber}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Thời gian: {new Date(appr.certInfo.tsaTimestamp || appr.createdAt).toLocaleString("vi-VN")}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveCert(appr.certInfo)}
                                  className="text-[10px] text-blue-700 font-medium hover:underline pt-0.5 block"
                                >
                                  Tra cứu chứng thư số X.509 &rarr;
                                </button>
                              </div>
                            )}

                            {/* Handwritten Signature Image Display */}
                            {isApproved && appr.signatureImage && (
                              <div className="p-2 bg-white border border-slate-200 rounded-md">
                                <span className="text-[10px] text-slate-400 block mb-1">Chữ ký điện tử:</span>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={appr.signatureImage} 
                                  alt="Chữ ký" 
                                  className="h-12 object-contain"
                                />
                              </div>
                            )}

                            <span className="text-[10px] text-slate-400 block">
                              Cập nhật: {new Date(appr.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      </div>

      {/* Viettel MySign Real-time Mobile Authentication Simulation Modal */}
      {viettelStep > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-bold text-xl text-slate-900">
                Xác thực ký số Viettel MySign
              </h3>
              <p className="text-xs text-slate-500">
                Kết nối Cổng Chứng thực Viettel-CA Cloud Gateway
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  viettelStep >= 1 ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600"
                }`}>
                  1
                </div>
                <span className="text-xs font-medium text-slate-700">Tạo mã băm tài liệu SHA-256</span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  viettelStep >= 2 ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600"
                }`}>
                  2
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-700 block">
                    Đẩy thông báo tới App Viettel MySign ({approverPhone})
                  </span>
                  {viettelStep === 2 && (
                    <span className="text-[11px] text-red-600 font-semibold animate-pulse block mt-0.5">
                      📲 Đang chờ Sếp quét FaceID / Vân tay trên điện thoại...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  viettelStep >= 3 ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-600"
                }`}>
                  3
                </div>
                <span className="text-xs font-medium text-slate-700">Đóng dấu chứng thư số X.509 PAdES</span>
              </div>
            </div>

            {viettelStep === 3 ? (
              <div className="text-emerald-600 font-bold text-sm flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Xác thực sinh trắc học thành công!
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                Đang giữ kết nối an toàn với máy chủ Viettel...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificate Detail Modal */}
      {activeCert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                  VT
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  Chứng thư số Viettel-CA
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveCert(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Tổ chức chứng thực (CA):</span>
                <span className="font-semibold text-slate-800">{activeCert.issuer}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Chủ thể chứng thư (Subject):</span>
                <span className="font-semibold text-slate-800">{activeCert.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Số Serial định danh:</span>
                <span className="font-mono text-slate-800 font-semibold">{activeCert.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Thời gian đóng dấu số (TSA Timestamp):</span>
                <span className="text-slate-800 font-medium">{new Date(activeCert.tsaTimestamp).toLocaleString("vi-VN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mã băm toàn vẹn tài liệu (SHA-256 Digest):</span>
                <span className="font-mono text-[10px] text-slate-600 break-all">{activeCert.docHash}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hiệu lực chứng thư:</span>
                <span className="text-emerald-700 font-semibold">Đến ngày {new Date(activeCert.validTo).toLocaleDateString("vi-VN")} (HỢP CHUẨN PHÁP LÝ)</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setActiveCert(null)} className="bg-slate-900 text-white">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
