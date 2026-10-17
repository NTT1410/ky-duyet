# 📋 Dự án Hệ thống Ký duyệt & Văn bản Nội bộ (E-Approval System)

## 1. Tổng quan & Mục tiêu
Xây dựng một hệ thống phần mềm giúp doanh nghiệp số hóa toàn bộ quy trình trình duyệt, luân chuyển và ban hành văn bản nội bộ.
Mục tiêu: Xóa bỏ giấy tờ vật lý, rút ngắn thời gian chờ duyệt, minh bạch hóa trách nhiệm và dễ dàng tra cứu.

## 2. Phân tích Roles (Vai trò người dùng)
- **Người dùng cơ bản (Nhân viên/Chuyên viên):** Tạo tờ trình, đính kèm tài liệu, chọn luồng duyệt, theo dõi tiến độ.
- **Người phê duyệt (Trưởng phòng/Giám đốc):** Nhận thông báo, xem hồ sơ, ghi chú/phản hồi, từ chối hoặc ký/duyệt.
- **Văn thư:** Cấp số văn bản, ban hành, đóng dấu (ảo) và lưu trữ.
- **Quản trị viên (Admin):** Quản lý sơ đồ tổ chức, phân quyền, thiết lập mẫu luồng duyệt (Workflow templates).

## 3. Các tính năng cốt lõi (Core Modules)
1. **Quản lý Định danh & Tổ chức:** Cây sơ đồ tổ chức (Phòng ban, Chức vụ), Phân quyền RBAC (Role-Based Access Control).
2. **Workflow Engine (Luồng duyệt linh hoạt):**
   - Duyệt tuần tự (A -> B -> C).
   - Duyệt song song (B và C cùng duyệt sau A).
   - Cho phép người tạo tự chọn người duyệt hoặc theo luồng mặc định của loại văn bản.
3. **Quản lý Tài liệu & Chữ ký điện tử:**
   - Upload/View PDF, Word trực tiếp trên trình duyệt.
   - Ký điện tử (Chữ ký ảnh/OTP) hoặc tích hợp Ký số pháp lý (USB Token, VNPT SmartCA, Viettel-CA) nếu công ty yêu cầu tính pháp lý cao.
4. **Hệ thống Thông báo (Notification System):** Real-time qua Web Socket, Email gửi khi có hồ sơ cần duyệt, bị từ chối hoặc hoàn thành.
5. **Dashboard & Báo cáo:** Thống kê hồ sơ đang chờ, hồ sơ trễ hạn, hiệu suất xử lý của từng cá nhân/phòng ban.

## 4. Đề xuất Kiến trúc & Tech Stack
Áp dụng theo các tiêu chuẩn hệ thống hiện đại và rule code của anh:
- **Frontend (Web App):** Next.js (App Router) + TypeScript.
  - UI Library: Tailwind CSS + Shadcn UI (Dễ dàng custom theo `ui-ux-pro-max`, đảm bảo thẩm mỹ cao, không dùng component mặc định nhàm chán).
  - State Management: Zustand + TanStack Query.
- **Backend (API):** Node.js (NestJS hoặc Express + TypeScript). 
  - Tuân thủ `nodejs-backend-patterns` và `typescript-pro`.
  - Architecture: Modular Monolith, phân tách rõ ràng Service, Repository, Controller.
- **Database:**
  - PostgreSQL: Dữ liệu quan hệ, cực kỳ phù hợp cho quản lý users, sơ đồ tổ chức, luồng duyệt phức tạp.
  - Redis: Caching, quản lý Session, Background Jobs (hàng đợi gửi email, push notification).
- **Lưu trữ (Storage):** AWS S3 hoặc MinIO (Self-hosted S3) để lưu trữ file PDF, DOCX an toàn, hỗ trợ versioning.

## 5. Lộ trình triển khai (Roadmap)
Dự án có thể chia thành 4 Giai đoạn (Phases):

### Giai đoạn 1: Phân tích UI/UX & Thiết kế Database (Tuần 1-2)
- Theo rule: Khảo sát Inspo 2-3 web tương tự (như Base Request, 1Office, Lark Suite).
- Chốt bảng màu, font chữ, phong cách (ưu tiên Minimalist / Corporate Clean).
- Thiết kế Database Schema chi tiết (ERD) và API Docs.

### Giai đoạn 2: Core Backend & Auth (Tuần 3-4)
- Setup Boilerplate chuẩn.
- Xây dựng sơ đồ tổ chức, Authentication & Authorization.
- Quản lý file storage (Upload/Download tài liệu).

### Giai đoạn 3: Workflow Engine & Tờ trình (Tuần 5-7)
- Xây dựng core luồng duyệt động.
- Giao diện tạo tờ trình, ký duyệt (Tích hợp UI viewer PDF, kéo thả vị trí chữ ký).
- Tích hợp thông báo (Email, Realtime notifications).

### Giai đoạn 4: Testing, Tối ưu & Bàn giao (Tuần 8)
- Test accessibility, performance (Modern Web Guidance).
- Review code đa ngôn ngữ.
- Chuẩn bị tài liệu Handoff cho phía công ty.
