"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Lưu token vào cookie để middleware hoặc fetch có thể lấy
        setCookie("auth_token", data.token, { maxAge: 60 * 60 * 24 });
        
        toast.success("Đăng nhập thành công!");
        router.push("/");
      } else {
        toast.error("Đăng nhập thất bại", { description: data.message });
      }
    } catch (error) {
      toast.error("Lỗi kết nối", { description: "Không thể kết nối đến máy chủ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <form onSubmit={handleLogin}>
          <CardHeader className="space-y-2 text-center bg-white rounded-t-lg">
            <div className="mx-auto bg-blue-100 w-12 h-12 flex items-center justify-center rounded-full mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <CardTitle className="text-2xl font-heading">Đăng nhập</CardTitle>
            <CardDescription>Hệ thống trình duyệt văn bản nội bộ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 bg-white p-6 pt-4">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email công việc</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="vd: manager.it@company.com" 
                defaultValue="manager.it@company.com"
                required 
                className="focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Mật khẩu</Label>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                defaultValue="123456"
                required 
                className="focus-visible:ring-blue-600"
              />
            </div>
            
            <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-100">
              <p className="font-medium text-slate-700 mb-1">Tài khoản Test Demo:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>Sếp IT: manager.it@company.com</li>
                <li>Kế toán: ketoantruong@company.com</li>
                <li>Nhân viên: dev@company.com</li>
                <li>Mật khẩu chung: 123456</li>
              </ul>
            </div>

          </CardContent>
          <CardFooter className="bg-slate-50/50 p-6 pt-4 rounded-b-lg border-t border-slate-100">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
