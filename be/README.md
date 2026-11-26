# Backend Nihongo Master

Chạy các lệnh tại `nihongo-master/be` với Node.js 22.19 trở lên trong nhánh 22. Dùng `npm` thay cho `npm.cmd` trên Bash.

## Chuẩn bị database và chạy API

```powershell
npm.cmd ci
if (!(Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
```

Với Neon, mở **Connect** và chọn cùng branch, database và role cho hai URL. Bật **Connection pooling** khi lấy `DATABASE_URL` và tắt khi lấy `DIRECT_URL`. Điền vào `.env`. [Tài liệu kết nối Neon](https://neon.com/docs/get-started/connect-neon)

Với PostgreSQL cục bộ, dùng cấu hình trong [.env.example](.env.example) và bỏ `DIRECT_URL`. Mở một terminal khác tại `be` để chạy `npm.cmd run dev:db` hoặc `docker compose up -d postgres`. PostgreSQL nhúng lưu dữ liệu trong `be/.local/postgres-55432`. Để dùng lại thư mục dữ liệu `.local/postgres-55432` từ bản cũ, dừng PostgreSQL rồi chuyển nguyên thư mục vào `be/.local` trước khi khởi động.

Với database đã có dữ liệu, tạo Prisma Client rồi chạy API.

```powershell
npm.cmd run db:generate
npm.cmd run dev
```

Với database mới, chạy ba lệnh sau sau khi tạo Prisma Client và trước khi chạy API.

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:import
```

Nếu Node trên Windows báo lỗi chứng chỉ khi tải dependencies hoặc dữ liệu nguồn, đặt `$env:NODE_USE_SYSTEM_CA='1'` rồi thử lại.

Health check ở `http://127.0.0.1:4000/api/health`. API học tập gồm danh sách theo loại, sách, flashcard, tra cứu, chi tiết mục và nguồn dữ liệu dưới `/api/catalog`. [Nguồn và giấy phép](docs/DATA.md)

## Deploy trên Render

| Mục | Giá trị |
| --- | --- |
| Root Directory | `be` |
| Build Command | `npm ci --include=dev && npm run db:generate` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Trong **Environment**, đặt `DATABASE_URL` và `DIRECT_URL` theo Neon, `APP_ORIGIN` bằng domain HTTPS của frontend, `NODE_ENV=production`, `NODE_VERSION=22.22.0` và `TRUST_PROXY=1`. Render tự cấp `PORT`. Đặt `MEDIA_BASE_URL` nếu bạn phục vụ tài nguyên nhập thêm có đường dẫn `/media/` ở một nơi khác.

Với Blueprint, đặt **Blueprint Path** thành `be/render.yaml`. [Blueprint này](render.yaml) dùng Render Starter và chạy migration, seed và import ở bước pre-deploy. Với Web Service Free, có thể chuẩn bị database bằng các lệnh local ở trên. Khi dùng lại service cũ, cập nhật Root Directory và các lệnh, rồi chạy **Manual Deploy → Clear build cache & deploy**. [Hướng dẫn Root Directory của Render](https://render.com/docs/monorepo-support#setting-a-root-directory)

## Kiểm thử

Sau khi khởi tạo một database kiểm thử, chạy `npm.cmd run lint` và `npm.cmd test` trong `be` với `DATABASE_URL` trỏ đến database đó.
