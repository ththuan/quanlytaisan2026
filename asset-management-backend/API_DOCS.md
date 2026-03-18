# API Documentation - Asset Management System

## Giới thiệu
Tài liệu này cung cấp hướng dẫn chi tiết về cách sử dụng API của hệ thống Quản lý Tài sản.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "fullName": "Admin User",
      "role": "admin"
    }
  }
}
```

### Sử dụng JWT Token
Sau khi đăng nhập, thêm token vào header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Endpoints

### 1. Authentication

#### Đăng ký người dùng
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "departmentId": 1
}
```

#### Đổi mật khẩu
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

#### Lấy thông tin user hiện tại
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 2. Users (Người dùng)

#### Danh sách người dùng
```http
GET /api/users?page=1&limit=20&search=Nguyễn
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "admin@example.com",
        "fullName": "Admin User",
        "role": "admin",
        "department": {
          "id": 1,
          "name": "IT"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### Tạo người dùng mới
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "Trần Thị B",
  "phone": "0987654321",
  "role": "staff",
  "departmentId": 2
}
```

#### Cập nhật người dùng
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A (Cập nhật)",
  "phone": "0123456789",
  "role": "staff",
  "departmentId": 3,
  "isActive": true
}
```

#### Xóa người dùng
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

#### Phân quyền
- `admin`: Full access
- `director`: Access đến báo cáo và thống kê
- `staff`: Read-only access
- `department_head`: Access đến tài sản của phòng ban

---

### 3. Assets (Tài sản)

#### Danh sách tài sản
```http
GET /api/assets?page=1&limit=20&status=active&categoryId=1
Authorization: Bearer <token>

Query Parameters:
- page: Số trang (default: 1)
- limit: Số lượng mỗi trang (default: 20)
- status: Trạng thái (active, inactive, maintenance, disposed)
- categoryId: Lọc theo danh mục
- search: Tìm kiếm theo tên, mã tài sản
- departmentId: Lọc theo phòng ban
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": 1,
        "assetCode": "ASSET-001",
        "name": "Laptop Dell XPS 13",
        "category": {
          "id": 1,
          "name": "Thiết bị điện tử"
        },
        "status": "active",
        "purchaseDate": "2024-01-15",
        "purchasePrice": 25000000,
        "location": "Văn phòng Hà Nội",
        "department": {
          "id": 1,
          "name": "IT"
        },
        "assignedTo": {
          "id": 5,
          "fullName": "Nguyễn Văn A"
        },
        "qrCode": "data:image/png;base64,iVBORw0KGgo..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

#### Tạo tài sản mới
```http
POST /api/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetCode": "ASSET-002",
  "name": "Máy in HP LaserJet",
  "categoryId": 2,
  "status": "active",
  "purchaseDate": "2024-02-01",
  "purchasePrice": 15000000,
  "warrantyUntil": "2025-02-01",
  "location": "Văn phòng Hà Nội",
  "departmentId": 1,
  "description": "Máy in dùng cho phòng IT"
}
```

#### Cập nhật tài sản
```http
PUT /api/assets/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop Dell XPS 13 (Cập nhật)",
  "status": "maintenance",
  "location": "Phòng bảo trì",
  "notes": "Đang sửa chữa màn hình"
}
```

#### Xóa tài sản
```http
DELETE /api/assets/:id
Authorization: Bearer <token>
```

#### Lấy lịch sử chuyển giao
```http
GET /api/assets/:id/history
Authorization: Bearer <token>
```

#### Upload ảnh tài sản
```http
POST /api/assets/:id/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
```

#### Import tài sản từ Excel
```http
POST /api/assets/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <excel-file>
```

**Excel format:**
| assetCode | name | categoryId | purchaseDate | purchasePrice | location |
|-----------|------|------------|--------------|---------------|----------|
| ASSET-003 | Máy tính bảng iPad | 1 | 2024-03-01 | 15000000 | Văn phòng Hà Nội |

#### Export tài sản ra Excel
```http
GET /api/assets/export
Authorization: Bearer <token>
```

---

### 4. Transfers (Chuyển giao)

#### Danh sách yêu cầu chuyển giao
```http
GET /api/transfers?page=1&limit=20&status=pending
Authorization: Bearer <token>
```

#### Tạo yêu cầu chuyển giao
```http
POST /api/transfers
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": 1,
  "fromDepartmentId": 1,
  "toDepartmentId": 2,
  "fromUserId": 5,
  "toUserId": 10,
  "reason": "Chuyển giao tài sản cho dự án mới",
  "expectedDate": "2024-03-20"
}
```

#### Phê duyệt chuyển giao
```http
PUT /api/transfers/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "approvedBy": 1,
  "actualDate": "2024-03-18",
  "notes": "Đã phê duyệt"
}
```

#### Từ chối chuyển giao
```http
PUT /api/transfers/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "rejectedBy": 1,
  "reason": "Không đủ điều kiện chuyển giao"
}
```

---

### 5. Maintenance (Bảo trì)

#### Danh sách yêu cầu bảo trì
```http
GET /api/maintenance?page=1&limit=20&status=pending
Authorization: Bearer <token>
```

#### Tạo yêu cầu bảo trì
```http
POST /api/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetId": 1,
  "type": "repair",
  "priority": "high",
  "description": "Màn hình bị hỏng, cần thay mới",
  "expectedDate": "2024-03-19"
}
```

#### Cập nhật yêu cầu bảo trì
```http
PUT /api/maintenance/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Đang chờ linh kiện"
}
```

#### Phê duyệt bảo trì
```http
PUT /api/maintenance/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "approvedBy": 1,
  "actualCost": 2000000,
  "completedDate": "2024-03-18"
}
```

---

### 6. Reports (Báo cáo)

#### Báo cáo hàng năm
```http
GET /api/reports/annual?year=2024
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "summary": {
      "totalAssets": 500,
      "totalValue": 15000000000,
      "newAssets": 100,
      "disposedAssets": 20,
      "maintenanceCost": 500000000
    },
    "byCategory": [
      {
        "category": "Thiết bị điện tử",
        "count": 300,
        "value": 10000000000
      }
    ],
    "byDepartment": [
      {
        "department": "IT",
        "count": 200,
        "value": 8000000000
      }
    ]
  }
}
```

#### Thống kê
```http
GET /api/reports/statistics
Authorization: Bearer <token>
```

#### Export báo cáo
```http
POST /api/reports/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "annual",
  "year": 2024,
  "format": "excel"
}
```

---

### 7. Departments (Phòng ban)

#### Danh sách phòng ban
```http
GET /api/departments
Authorization: Bearer <token>
```

#### Tạo phòng ban
```http
POST /api/departments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Phòng Kế toán",
  "code": "ACC",
  "description": "Phòng kế toán tài chính",
  "managerId": 15
}
```

#### Cập nhật phòng ban
```http
PUT /api/departments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Phòng Kế toán - Tài chính",
  "managerId": 15
}
```

#### Xóa phòng ban
```http
DELETE /api/departments/:id
Authorization: Bearer <token>
```

---

## Error Handling

### Response format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email là trường bắt buộc",
    "details": [
      {
        "field": "email",
        "message": "Email không được để trống"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting
- 100 requests per 10 minutes per IP
- Response headers:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1647360000
  ```

## Cache Headers
```
X-Cache: HIT    # Response từ cache
X-Cache: MISS   # Response từ database
```

---

## Examples

### JavaScript (Fetch)
```javascript
// Đăng nhập
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  return data.data.token;
};

// Lấy danh sách tài sản
const getAssets = async (token, page = 1) => {
  const response = await fetch(`http://localhost:5000/api/assets?page=${page}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### cURL
```bash
# Đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Lấy danh sách tài sản
curl -X GET http://localhost:5000/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Swagger UI
Truy cập http://localhost:5000/api-docs để xem và test API trực tiếp.
