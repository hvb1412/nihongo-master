# Nihongo Master

Website tự học tiếng Nhật bằng tiếng Việt với các mục **Từ vựng, Ngữ pháp, Kanji, Luyện đọc và Luyện nghe**. Chọn **Flash Card** để ôn toàn bộ từ vựng hoặc Kanji trong thư viện, hoặc lọc theo cấp JLPT N5–N1.

## Chạy với Neon

Yêu cầu **Node.js 22.19 trở lên** và npm. Chạy các lệnh tại thư mục `nihongo-master`, nơi có `package.json`.

```powershell
npm.cmd ci
if (!(Test-Path -LiteralPath be/.env)) { Copy-Item be/.env.example be/.env }
```

Trong **Neon Console → Connect**, lấy hai URL từ cùng một branch, database và role. Bật **Connection pooling** khi lấy `DATABASE_URL` và tắt khi lấy `DIRECT_URL`. Điền vào `be/.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@ENDPOINT-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@ENDPOINT.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15"
```

`DATABASE_URL` dùng cho backend và nạp dữ liệu. `DIRECT_URL` dùng cho Prisma CLI. Git bỏ qua `be/.env`. [Tài liệu kết nối Neon](https://neon.com/docs/get-started/connect-neon)

Với database mới, tạo Prisma Client, chạy migration và nạp nội dung:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:import
```

Với database Neon đã có dữ liệu, chạy `npm.cmd run db:generate` sau khi cài dependencies và chạy ứng dụng:

```powershell
npm.cmd run dev
```

- [Giao diện](http://127.0.0.1:4175)
- [Health check](http://127.0.0.1:4000/api/health)
- Trên Bash, dùng `npm` và `test -f be/.env || cp be/.env.example be/.env`.
- Nếu Node trên Windows báo lỗi chứng chỉ khi tải dependencies hoặc dữ liệu nguồn, đặt `$env:NODE_USE_SYSTEM_CA='1'` rồi thử lại.

### PostgreSQL cục bộ

Dùng `DATABASE_URL` cục bộ trong [be/.env.example](be/.env.example) và bỏ `DIRECT_URL`. Chạy `npm.cmd run dev:db` ở terminal riêng hoặc `docker compose up -d postgres`. Sau đó chạy các lệnh khởi tạo và `npm.cmd run dev` như trên.

## Nội dung học

| Mục | Nội dung |
| --- | --- |
| Từ vựng | Cách viết, cách đọc, âm Hán Việt theo chữ Kanji, nghĩa tiếng Việt và câu ví dụ |
| Ngữ pháp | Công thức, cách dùng và ví dụ song ngữ |
| Kanji | Âm Hán Việt, âm On/Kun, bộ thủ, thứ tự nét và bảng luyện viết |
| Luyện đọc | Bài đọc tiếng Nhật, bản dịch tiếng Việt, Furigana và tra từ trong bài |
| Luyện nghe | Âm thanh tiếng Nhật, điều chỉnh tốc độ, bản chép lời và bản dịch |

Ô tra cứu Nhật–Việt tìm theo Kanji, Kana, Romaji và tiếng Việt có dấu hoặc không dấu. Ví dụ, nhập `勉強` để xem mục từ và hai chữ `勉`, `強`.

Trong danh sách, chọn **Mở mục** để xem chi tiết và mở từng chữ Kanji ngay trong popup. Cơ sở dữ liệu cũ có thể chạy lại `npm.cmd run db:import` để bổ sung âm Hán Việt.

Chọn **Lưu** trên từ vựng, mẫu ngữ pháp hoặc chữ Kanji, rồi mở **Đã lưu** trong menu để xem lại hoặc bỏ lưu. Danh sách được giữ trên trình duyệt bạn đang dùng.

Chọn **Học đến đây** để đánh dấu vị trí trong sách. Mỗi sách Từ vựng, Ngữ pháp và Kanji giữ một vị trí riêng. Chọn **Học tiếp** ở trang chủ hoặc đầu trang sách để quay về đúng bộ lọc, trang và mục đã đánh dấu trên cùng trình duyệt.

## Kiến trúc và dữ liệu

- `fe/` chứa giao diện React, TypeScript và Vite. `be/` chứa API Express, Prisma, PostgreSQL và pipeline nhập dữ liệu.
- Các API đọc gồm `GET /api/health`, `GET /api/catalog/:kind`, `GET /api/catalog/search`, `GET /api/catalog/entries/:id` và `GET /api/catalog/sources`. Danh sách hỗ trợ phân trang, từ khóa và cấp JLPT.
- `db:seed` thêm các mục biên soạn cùng 5 bài đọc và 5 bài nghe. `db:import` bổ sung nội dung từ điển, nghĩa tiếng Việt, câu ví dụ, liên kết Kanji và thứ tự nét. Lượt nhập lại giữ ID và nội dung đã biên tập.
- Bộ dữ liệu từ điển gồm 10.723 mục. Trang chi tiết ghi rõ các nghĩa dịch tự động. [Nguồn và giấy phép](docs/DATA.md)
- Schema PostgreSQL vẫn tương thích với database đã tạo ở các phiên bản trước. API hiện tại chỉ đọc nội dung của năm mục học.

## Kiểm thử

Sau khi chạy migration, seed và import trên database kiểm thử:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Chạy ứng dụng, cài Chromium bằng `npx playwright install chromium`, rồi chạy `npm.cmd run test:e2e`. Có thể đặt `PLAYWRIGHT_BROWSER_CHANNEL=chrome` nếu đã cài Chrome hoặc `msedge` nếu đã cài Edge.

## Triển khai

| Biến | Mục đích |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL cho API và các lệnh nạp dữ liệu |
| `DIRECT_URL` | URL trực tiếp cho Prisma CLI khi `DATABASE_URL` là URL pooled |
| `PORT` | Cổng API, mặc định là `4000` |
| `APP_ORIGIN` | Origin giao diện được phép gọi API từ trình duyệt |
| `MEDIA_BASE_URL` | HTTPS base URL cho tài nguyên có đường dẫn `/media/` |
| `SERVE_FRONTEND` | Đặt `1` để Express phục vụ SPA đã build |
| `TRUST_PROXY` | Đặt `1` khi API ở sau một reverse proxy tin cậy |
| `API_ORIGIN` | HTTPS origin của backend khi dùng Vercel |
| `VITE_API_URL` | URL API tùy chỉnh, mặc định dùng `/api` cùng origin |

Render dùng [render.yaml](render.yaml) để build, migrate, seed và import trước khi mở ứng dụng. Nếu dùng Vercel cho frontend, chọn thư mục gốc của repository, đặt `API_ORIGIN` trỏ đến dịch vụ Render và dùng `APP_ORIGIN` là origin của Vercel trên backend.
