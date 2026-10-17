# 🎨 Frontend Design Guidelines (UI/UX)
**Dự án:** Hệ thống Ký duyệt & Văn bản Nội bộ
**Phong cách:** Corporate Minimalist (Hiện đại, tối giản, tập trung vào tính rõ ràng của dữ liệu)

---

## 1. Phân tích Nguồn cảm hứng (Inspo)
Dựa theo rule, em đã lấy cảm hứng từ 3 sản phẩm thực tế hàng đầu trong mảng B2B / SaaS Quản trị doanh nghiệp:
1. **Lark Suite (Approval Module):** Giao diện sử dụng sidebar tối giản, các trạng thái duyệt (Pending, Approved, Rejected) sử dụng màu Semantic (Vàng, Xanh lá, Đỏ) với độ tương phản cao, badge bo tròn mềm mại.
2. **Base Request (Base.vn):** Cấu trúc form cực kỳ chặt chẽ, tập trung vào flow dọc. Background xám nhạt để làm nổi bật "Tờ trình" nền trắng (cảm giác như đang xem 1 tờ giấy A4 thật).
3. **Notion:** Phân cấp typography xuất sắc, đường viền (border) siêu mỏng, sử dụng các icon line-art mỏng để giao diện không bị ngợp.

---

## 2. Typography (Kiểu chữ)
Tuân thủ rule tuyệt đối không dùng font hệ thống chung (Arial/system-ui), dự án sẽ sử dụng các font Google Fonts chất lượng cao:

- **Heading (Tiêu đề):** `Plus Jakarta Sans`
  - Lý do: Font chữ có nét hiện đại, hình học (geometric) rất sang trọng, phù hợp để làm nổi bật tên tờ trình, tên phòng ban.
  - Weight: 600 (Semi-bold), 700 (Bold).
- **Body & Data (Đoạn văn & Bảng biểu):** `Inter`
  - Lý do: Vua của font chữ giao diện (UI font), tối ưu khả năng đọc số liệu, khoảng cách ký tự (kerning) cực tốt cho form nhập liệu.
  - Weight: 400 (Regular), 500 (Medium).

---

## 3. Bảng màu (Color Palette)
Không dùng màu gradient tím mặc định. Bảng màu được thiết kế để tạo sự chuyên nghiệp (Corporate) và tin cậy:

### A. Màu thương hiệu & Nền (Brand & Background)
- **Primary (Xanh Tín Nhiệm):** `#2563EB` (Blue 600) - Dùng cho nút bấm chính (Gửi duyệt, Ký duyệt), link đang active.
- **Primary Hover:** `#1D4ED8` (Blue 700)
- **Background (Nền hệ thống):** `#F8FAFC` (Slate 50) - Màu xám lạnh hơi pha xanh, giúp mắt không bị mỏi khi nhìn màn hình 8 tiếng/ngày.
- **Surface (Nền thẻ/Card):** `#FFFFFF` - Nền trắng tinh để làm nổi bật vùng nội dung Tờ trình (A4).

### B. Màu Văn bản (Text & Typography)
- **Heading Text:** `#0F172A` (Slate 900) - Đen sâu, tạo độ tương phản cao.
- **Body Text:** `#475569` (Slate 600) - Xám, dùng cho các đoạn text phụ, mô tả, ngày tháng.
- **Borders & Dividers:** `#E2E8F0` (Slate 200) - Viền mỏng, tinh tế.

### C. Màu Trạng thái (Semantic - Cực kỳ quan trọng cho app Duyệt)
- 🟢 **Approved (Đã duyệt):** Nền `#D1FAE5` (Emerald 100) - Chữ `#047857` (Emerald 700)
- 🔴 **Rejected (Từ chối):** Nền `#FEE2E2` (Red 100) - Chữ `#B91C1C` (Red 700)
- 🟡 **Pending (Đang chờ):** Nền `#FEF3C7` (Amber 100) - Chữ `#B45309` (Amber 700)

---

## 4. UI Components (Hướng dẫn cho Shadcn UI)
- **Border Radius (Độ bo góc):** Chốt mức `0.5rem` (8px). Không bo tròn hẳn viên thuốc (quá trẻ trung), không vuông vức sắc cạnh (quá lỗi thời).
- **Shadow (Đổ bóng):** Dùng soft-shadow (đổ bóng mờ, to). Hạn chế shadow đen đậm. 
  - *Ví dụ:* `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);`
- **Buttons (Nút bấm):**
  - Hành động chính (Approve): Solid background (Màu xanh Primary).
  - Hành động phụ (Cancel): Outline border xám nhạt, chữ đen.
  - Hành động nguy hiểm (Reject): Nền trắng, chữ Đỏ (Ghost button) để tránh ấn nhầm, hoặc Solid Đỏ nếu là popup xác nhận.

## 5. Layout (Cấu trúc Bố cục)
Sử dụng mô hình **Sidebar + Content Canvas**:
- **Trái (250px):** Sidebar chứa Menu (Tờ trình của tôi, Cần tôi duyệt, Quản lý luồng, Cài đặt).
- **Giữa (Mở rộng):** Danh sách (Data Table) với bộ filter mạnh mẽ trên cùng.
- **Khi xem chi tiết (Detail View):** Mở dạng Drawer (Kéo từ phải qua) hoặc Split View để xem nhanh Tờ trình mà không bị mất bối cảnh danh sách. Không nên chuyển sang một trang mới hoàn toàn.
