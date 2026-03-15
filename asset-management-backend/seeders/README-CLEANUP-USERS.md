# Hướng dẫn xóa tất cả người dùng (chỉ giữ lại admin)

## Mô tả
Script này sẽ xóa tất cả người dùng trong hệ thống, chỉ giữ lại tài khoản admin.

## ⚠️ CẢNH BÁO
- **Thao tác này không thể hoàn tác!**
- Tất cả dữ liệu người dùng (trừ admin) sẽ bị xóa vĩnh viễn
- Đảm bảo bạn đã backup dữ liệu nếu cần

## Cách chạy

### 1. Chạy seeder để xóa người dùng
```bash
cd asset-management-backend
npx sequelize-cli db:seed --seed 20260119000000-cleanup-users.js
```

### 2. Kiểm tra kết quả
Sau khi chạy, chỉ còn lại tài khoản admin:
- Username: `admin`
- Email: `admin@example.com`
- Password: `Admin@123`

## Lưu ý
- Nếu bạn muốn tạo lại dữ liệu người dùng mẫu, có thể chạy lại các seeder khác:
  ```bash
  npx sequelize-cli db:seed --seed 20260116000001-role-users.js
  ```

## Rollback
Không thể rollback việc xóa dữ liệu. Nếu cần khôi phục, bạn phải:
1. Restore từ backup database
2. Hoặc chạy lại các seeder để tạo lại dữ liệu mẫu
