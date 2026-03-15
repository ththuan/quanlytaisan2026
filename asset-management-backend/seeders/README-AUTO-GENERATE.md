# Seeder Tự Động Tạo Dữ Liệu Mẫu

## 🎯 Mục đích

Seeder này **tự động** tạo dữ liệu mẫu dựa trên các phòng ban hiện có trong database:

- ✅ Tự động lấy tất cả phòng ban từ database
- ✅ Tự động tạo users cho mỗi phòng ban (Department Head, Manager, Staff)
- ✅ Tự động tạo tài sản phân bổ cho các phòng ban
- ✅ Tự động tính khấu hao theo Thông tư 141/2025
- ✅ Không gây lỗi nếu dữ liệu đã tồn tại

## 🚀 Cách sử dụng

### Bước 1: Đảm bảo đã có phòng ban trong database

Seeder này sẽ tự động lấy các phòng ban hiện có. Bạn có thể:

**Option A:** Sử dụng phòng ban từ seeder cũ
```bash
npx sequelize-cli db:seed --seed 20260112000001-departments.js
```

**Option B:** Tạo phòng ban thủ công qua giao diện web

**Option C:** Sử dụng phòng ban đã có sẵn trong database

### Bước 2: Chạy seeder tự động

```bash
# Chạy seeder tự động
npx sequelize-cli db:seed --seed 20260118000002-auto-generate-from-departments.js

# Hoặc chạy tất cả seeders
npm run seed
```

### Bước 3: Xóa dữ liệu mẫu (nếu cần)

```bash
npx sequelize-cli db:seed:undo --seed 20260118000002-auto-generate-from-departments.js
```

## 📋 Dữ liệu được tạo tự động

### 1. Users cho mỗi phòng ban

Với mỗi phòng ban, seeder sẽ tạo:

- **1 Department Head** (Trưởng phòng/khoa)
  - Username: `truong_[tên_phòng_ban]`
  - Email: `truong.[tên_phòng_ban]@college.edu.vn`
  - Role: `department_head`
  - Được set làm manager của phòng ban đó

- **1 Manager** (Quản lý)
  - Username: `ql_[tên_phòng_ban]`
  - Email: `ql.[tên_phòng_ban]@college.edu.vn`
  - Role: `manager`

- **2 Staff** (Cán bộ)
  - Username: `nv_[tên_phòng_ban]_1`, `nv_[tên_phòng_ban]_2`
  - Email: `nv1.[tên_phòng_ban]@college.edu.vn`, `nv2.[tên_phòng_ban]@college.edu.vn`
  - Role: `staff`

### 2. Tài sản mẫu

Với mỗi phòng ban, seeder sẽ tạo:

- **Tài sản từ tất cả các danh mục** theo Thông tư 141/2025
- **Phân bổ đều** cho tất cả phòng ban
- **Tự động tính khấu hao** dựa trên năm đưa vào sử dụng
- **Giá trị đa dạng** (variation 80-120% so với giá gốc)

### 3. Admin và Director

Seeder sẽ tạo (nếu chưa có):
- **Admin**: `admin` / `admin@college.edu.vn`
- **Director**: `director` / `director@college.edu.vn`

## 🔑 Thông tin đăng nhập

**Mật khẩu mặc định:** `Password123!`

### Ví dụ với phòng ban "Phòng Công nghệ thông tin":

- **Trưởng phòng:**
  - Username: `truong_phong_cong_nghe_thong_tin`
  - Email: `truong.phong_cong_nghe_thong_tin@college.edu.vn`

- **Quản lý:**
  - Username: `ql_phong_cong_nghe_thong_tin`
  - Email: `ql.phong_cong_nghe_thong_tin@college.edu.vn`

- **Cán bộ 1:**
  - Username: `nv_phong_cong_nghe_thong_tin_1`
  - Email: `nv1.phong_cong_nghe_thong_tin@college.edu.vn`

- **Cán bộ 2:**
  - Username: `nv_phong_cong_nghe_thong_tin_2`
  - Email: `nv2.phong_cong_nghe_thong_tin@college.edu.vn`

## ✨ Tính năng thông minh

1. **Tự động phát hiện phòng ban:** Không cần config thủ công
2. **Không tạo trùng:** Kiểm tra và bỏ qua users/assets đã tồn tại
3. **Tự động tính khấu hao:** Dựa trên năm sử dụng và tỷ lệ khấu hao
4. **Phân bổ đều:** Mỗi phòng ban có đủ tài sản để test
5. **Variation giá:** Tài sản có giá khác nhau để test realistic

## 📊 Số lượng dữ liệu

Với **N phòng ban**, seeder sẽ tạo:

- **Users:** 4N + 2 (4 users/phòng ban + admin + director)
- **Assets:** ~(số danh mục × số template × N) tài sản

Ví dụ với 5 phòng ban:
- Users: ~22 users
- Assets: ~200-300 tài sản

## 🧪 Test các chức năng

Với dữ liệu này, bạn có thể test:

1. ✅ **Đăng nhập** với các role khác nhau
2. ✅ **Quản lý tài sản** - CRUD đầy đủ
3. ✅ **Lọc theo phòng ban** - Mỗi user chỉ thấy tài sản của phòng ban mình
4. ✅ **Phân quyền** - Test quyền truy cập theo role
5. ✅ **Khấu hao** - Xem tính toán khấu hao tự động
6. ✅ **Chuyển giao** - Chuyển tài sản giữa các phòng ban
7. ✅ **Báo cáo** - Xem thống kê theo phòng ban
8. ✅ **Kiểm kê** - Tạo đợt kiểm kê cho từng phòng ban
9. ✅ **Bảo trì** - Tạo yêu cầu bảo trì
10. ✅ **Import/Export** - Test import Excel

## ⚠️ Lưu ý

1. **Phải có phòng ban trước:** Seeder cần có ít nhất 1 phòng ban trong database
2. **Phải có danh mục tài sản:** Chạy migration tạo danh mục trước:
   ```bash
   npm run migrate
   ```
3. **Không ghi đè dữ liệu cũ:** Seeder sẽ bỏ qua users/assets đã tồn tại
4. **Username format:** Username được tạo từ tên phòng ban (loại bỏ dấu, lowercase)

## 🔧 Troubleshooting

### Lỗi: "No departments found"
```bash
# Tạo phòng ban trước
npx sequelize-cli db:seed --seed 20260112000001-departments.js
```

### Lỗi: "No asset categories found"
```bash
# Chạy migrations để tạo danh mục
npm run migrate
```

### Lỗi duplicate key
Seeder tự động bỏ qua dữ liệu đã tồn tại, nhưng nếu vẫn lỗi:
```bash
# Xóa dữ liệu cũ trước
npx sequelize-cli db:seed:undo --seed 20260118000002-auto-generate-from-departments.js
# Chạy lại
npx sequelize-cli db:seed --seed 20260118000002-auto-generate-from-departments.js
```

## 📝 Log output

Seeder sẽ hiển thị chi tiết:
- Danh sách phòng ban tìm thấy
- Users được tạo
- Assets được tạo
- Tổng kết cuối cùng

Ví dụ output:
```
🚀 Starting automatic data generation from existing departments...

📁 Fetching existing departments...
✅ Found 5 departments:
   1. Phòng Công nghệ thông tin (ID: 1, Type: room)
   2. Phòng Kế toán (ID: 2, Type: room)
   ...

👤 Creating admin and director users...
   ✅ Created admin user
   ✅ Created director user

👥 Creating users for each department...
   ✅ Created department head for: Phòng Công nghệ thông tin
   ✅ Created manager for: Phòng Công nghệ thông tin
   ✅ Created 2 staff users for: Phòng Công nghệ thông tin
   ...

🏢 Creating sample assets for each department...
✅ Created 250 sample assets

🎉 AUTOMATIC DATA GENERATION COMPLETED!
```
