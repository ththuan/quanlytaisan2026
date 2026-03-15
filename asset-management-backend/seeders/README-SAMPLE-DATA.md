# Hướng dẫn sử dụng dữ liệu mẫu

## Tổng quan

Seeder này tạo dữ liệu mẫu chi tiết để test toàn bộ hệ thống quản lý tài sản:

- **16 phòng ban** đầy đủ (theo danh sách từ hệ thống)
- **15 users** với tất cả các phân quyền
- **Hơn 60 tài sản mẫu** chi tiết theo từng loại danh mục Thông tư 141/2025/TT-BTC

## Cách chạy seeder

### 1. Đảm bảo đã chạy migrations

```bash
npm run migrate
```

### 2. Chạy seeder dữ liệu mẫu

```bash
# Chạy tất cả seeders
npm run seed

# Hoặc chạy seeder cụ thể
npx sequelize-cli db:seed --seed 20260118000001-comprehensive-sample-data.js
```

### 3. Xóa dữ liệu mẫu (nếu cần)

```bash
npx sequelize-cli db:seed:undo --seed 20260118000001-comprehensive-sample-data.js
```

## Thông tin đăng nhập

**Mật khẩu mặc định cho tất cả users: `Password123!`**

### Users với các phân quyền:

#### 1. Admin (Quyền cao nhất)
- **Username:** `admin`
- **Email:** `admin@college.edu.vn`
- **Fullname:** Nguyễn Văn Admin
- **Role:** `admin`
- **Quyền:** Toàn quyền quản lý hệ thống

#### 2. Director (Giám đốc)
- **Username:** `director`
- **Email:** `director@college.edu.vn`
- **Fullname:** Trần Thị Giám đốc
- **Role:** `director`
- **Quyền:** Phê duyệt các yêu cầu quan trọng

#### 3. Department Head (Trưởng khoa/phòng)
- **Username:** `truongkhoa_ngoaingu`
- **Email:** `truongkhoa.ngoaingu@college.edu.vn`
- **Fullname:** Lê Văn Trưởng Khoa
- **Role:** `department_head`
- **Department:** Ngoại ngữ - Tin học
- **Quyền:** Quản lý tài sản của khoa/phòng mình

- **Username:** `truongkhoa_kythuat`
- **Email:** `truongkhoa.kythuat@college.edu.vn`
- **Fullname:** Phạm Thị Trưởng Khoa
- **Role:** `department_head`
- **Department:** Kỹ thuật - Nông nghiệp

- **Username:** `truongphong_daotao`
- **Email:** `truongphong.daotao@college.edu.vn`
- **Fullname:** Hoàng Văn Trưởng Phòng
- **Role:** `department_head`
- **Department:** Phòng Đào tạo

- **Username:** `truongphong_ketoan`
- **Email:** `truongphong.ketoan@college.edu.vn`
- **Fullname:** Vũ Thị Trưởng Phòng
- **Role:** `department_head`
- **Department:** Phòng Kế hoạch - Tài chính

#### 4. Manager (Quản lý)
- **Username:** `manager1`
- **Email:** `manager1@college.edu.vn`
- **Fullname:** Đỗ Văn Quản lý
- **Role:** `manager`
- **Department:** Công nghệ thông tin - Truyền thông

- **Username:** `manager2`
- **Email:** `manager2@college.edu.vn`
- **Fullname:** Bùi Thị Quản lý
- **Role:** `manager`
- **Department:** Tài chính - Kế toán

#### 5. Staff (Cán bộ)
- **Username:** `staff1` đến `staff5`
- **Email:** `staff1@college.edu.vn` đến `staff5@college.edu.vn`
- **Role:** `staff`
- **Quyền:** Xem và quản lý tài sản của phòng ban mình

#### 6. User (Người dùng thường)
- **Username:** `user1`, `user2`
- **Email:** `user1@college.edu.vn`, `user2@college.edu.vn`
- **Role:** `user`
- **Quyền:** Chỉ xem tài sản

## Danh sách 16 phòng ban

1. Ngoại ngữ - Tin học
2. Kỹ thuật - Nông nghiệp
3. Trợ giúp kinh doanh
4. Công nghệ - Thủy sản
5. Nông nghiệp
6. Quản trị kinh doanh
7. Công nghệ thông tin - Truyền thông
8. Tài chính - Kế toán
9. Phòng Đào tạo
10. Phòng Công tác sinh viên
11. Phòng Tổ chức - Hành chính
12. Phòng Kế hoạch - Tài chính
13. Phòng Quản lý cơ sở vật chất
14. Phòng Khảo thí và Đảm bảo chất lượng
15. Phòng Hợp tác quốc tế
16. Phòng Thư viện

## Tài sản mẫu

Seeder tạo hơn 60 tài sản mẫu bao gồm:

### 1. Nhà, công trình xây dựng
- Biệt thự, công trình cấp đặc biệt (80 năm, 1.25%)
- Nhà cấp I, II, III, IV với các mức khấu hao khác nhau

### 2. Vật kiến trúc
- Kho chứa, bể chứa, bãi đỗ, sân thể thao (20 năm, 5%)
- Giếng khoan, tường rào (10 năm, 10%)

### 3. Xe ô tô
- Xe 7 chỗ, 16 chỗ, 4 chỗ (15 năm, 6.67%)

### 4. Phương tiện vận tải khác
- Xe máy, xe đạp điện (10 năm, 10%)

### 5. Máy móc, thiết bị
- Bàn ghế làm việc, họp (10 năm, 10%)
- Tủ đựng tài liệu, điều hòa (8 năm, 12.5%)
- Máy vi tính, máy in, máy photocopy (7 năm, 14.29%)
- Máy móc thiết bị khác (5 năm, 20%)

### 6. Tài sản cố định hữu hình khác
- Tủ lạnh, lò vi sóng, quạt trần (8 năm, 12.5%)

### 7. Công cụ dụng cụ
- Dụng cụ sửa chữa, thước đo (không tính khấu hao)

## Tính năng test

Với dữ liệu mẫu này, bạn có thể test:

1. ✅ **Đăng nhập/Đăng xuất** với các role khác nhau
2. ✅ **Quản lý tài sản** - CRUD đầy đủ
3. ✅ **Lọc và tìm kiếm** tài sản theo phòng ban, danh mục, trạng thái
4. ✅ **Phân quyền** - Kiểm tra quyền truy cập theo role
5. ✅ **Khấu hao tài sản** - Tính toán theo Thông tư 141/2025
6. ✅ **Chuyển giao tài sản** giữa các phòng ban
7. ✅ **Báo cáo** - Xem thống kê, báo cáo
8. ✅ **Kiểm kê tài sản** - Tạo và quản lý đợt kiểm kê
9. ✅ **Bảo trì/sửa chữa** - Quản lý yêu cầu bảo trì
10. ✅ **Import/Export** - Import tài sản từ Excel

## Lưu ý

- Tất cả tài sản đã được tính khấu hao tự động dựa trên năm đưa vào sử dụng
- Tài sản được phân bổ đều cho 16 phòng ban
- Một số tài sản có trạng thái `inactive` nếu đã vượt quá thời gian sử dụng
- Dữ liệu mẫu này phù hợp để test toàn bộ chức năng của hệ thống

## Troubleshooting

Nếu gặp lỗi khi chạy seeder:

1. **Lỗi foreign key:** Đảm bảo đã chạy migrations trước
2. **Lỗi duplicate:** Xóa dữ liệu cũ trước khi chạy lại:
   ```bash
   npx sequelize-cli db:seed:undo:all
   npm run seed
   ```
3. **Lỗi categories:** Đảm bảo đã chạy migration tạo danh mục tài sản:
   ```bash
   npm run migrate
   ```
