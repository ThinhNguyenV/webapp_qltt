# DocSys — Hệ thống Quản lý Tài liệu Trực tuyến

> Ứng dụng web quản lý tài liệu nội bộ với khả năng tìm kiếm toàn văn, phân quyền người dùng và báo cáo thống kê.

## 📋 Tổng quan

DocSys là hệ thống quản lý tài liệu (Document Management System) được xây dựng với kiến trúc **client–server** tách biệt:

- **Backend**: Node.js + Express, kết nối SQL Server và Elasticsearch
- **Frontend**: React 18 + Vite
- **Realtime**: Socket.IO cho thông báo thời gian thực
- **Tìm kiếm**: Elasticsearch 8.x (fallback về SQL Server nếu ES chưa sẵn sàng)

## 🏗️ Kiến trúc dự án

```
webapp/
├── server.js                 # Entry point — khởi động Express server
├── docker-compose.yml        # SQL Server + Elasticsearch containers
├── package.json              # Dependencies backend
│
├── src/
│   ├── config/
│   │   ├── db.js             # Kết nối SQL Server (Windows Auth / SQL Auth)
│   │   └── elasticsearch.js  # Client ES, sync & index documents
│   └── routes/
│       ├── auth.js           # Đăng nhập / xác thực
│       ├── documents.js      # CRUD tài liệu
│       ├── interactions.js   # Lượt xem, bình luận, tương tác
│       ├── reports.js        # Báo cáo & thống kê
│       ├── sqllab.js         # SQL Lab — truy vấn trực tiếp
│       └── users.js          # Quản lý người dùng
│
├── client/                   # React Frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── Admin/        # Trang quản trị
│   │   │   ├── Documents/    # Hiển thị & quản lý tài liệu
│   │   │   ├── Layout/       # Header, Sidebar, Layout chung
│   │   │   ├── LoginPage/    # Đăng nhập
│   │   │   ├── SqlLab/       # Giao diện SQL Lab
│   │   │   └── ui/           # Thành phần UI dùng chung
│   │   ├── contexts/         # React Context (Auth, Theme, ...)
│   │   ├── services/         # API call services
│   │   └── styles/           # CSS / styling
│   └── vite.config.js
│
├── database/
│   ├── doc_schema.sql        # Tạo bảng (DDL)
│   ├── doc_data.sql          # Dữ liệu mẫu
│   └── doc_advanced.sql      # View, stored procedure nâng cao
│
└── scripts/
    ├── db_config.json        # Cấu hình kết nối DB
    ├── deploy.js             # Script triển khai database
    └── hash_passwords.js     # Hash mật khẩu người dùng
```

## ⚙️ Yêu cầu hệ thống

| Thành phần         | Phiên bản    |
| ------------------- | ------------ |
| Node.js             | >= 18.x      |
| SQL Server          | 2019+ hoặc Azure SQL Edge |
| Elasticsearch       | 8.12+ (tuỳ chọn) |
| Docker & Docker Compose | Mới nhất (nếu dùng container) |

## 🚀 Cài đặt & Chạy

### 1. Clone repository

```bash
git clone https://github.com/ThinhNguyenV/webapp_qltt.git
cd webapp_qltt
```

### 2. Khởi động dịch vụ (Docker)

```bash
docker-compose up -d
```

Lệnh này sẽ khởi động:
- **SQL Server** (Azure SQL Edge) tại `localhost:1433`
- **Elasticsearch** tại `localhost:9200`

### 3. Triển khai database

```bash
npm install
node scripts/deploy.js
```

Script `deploy.js` sẽ tự động tạo database `DocumentDB`, chạy schema và import dữ liệu mẫu.

### 4. Cấu hình kết nối

Chỉnh sửa `scripts/db_config.json`:

**Windows Authentication:**
```json
{
  "server": "(local)",
  "driver": "{ODBC Driver 18 for SQL Server}",
  "type": "win"
}
```

**SQL Server Authentication (Docker):**
```json
{
  "server": "localhost",
  "user": "sa",
  "password": "Root@1234",
  "port": 1433,
  "type": "sql"
}
```

### 5. Chạy Backend

```bash
npm start
```

Backend sẽ chạy tại `http://localhost:3000`.

### 6. Chạy Frontend

```bash
cd client
npm install
npm run dev
```

Frontend (Vite) sẽ chạy tại `http://localhost:5173`.

## 📡 API Endpoints

| Method | Endpoint              | Mô tả                        |
| ------ | --------------------- | ----------------------------- |
| GET    | `/api/health`         | Health check                  |
| POST   | `/api/login`          | Đăng nhập                    |
| GET    | `/api/documents`      | Danh sách tài liệu           |
| POST   | `/api/documents`      | Tạo tài liệu mới             |
| GET    | `/api/users`          | Danh sách người dùng          |
| GET    | `/api/reports`        | Báo cáo thống kê             |
| POST   | `/api/sqllab/execute` | Thực thi truy vấn SQL Lab    |

## 🔧 Scripts hữu ích

```bash
# Hash mật khẩu người dùng
npm run hash-passwords

# Triển khai database
node scripts/deploy.js
```

## 🛠️ Tech Stack

- **Backend**: Express.js, mssql, bcryptjs, Socket.IO
- **Frontend**: React 18, Vite, Socket.IO Client
- **Database**: SQL Server / Azure SQL Edge
- **Search Engine**: Elasticsearch 8.x
- **Containerization**: Docker Compose
