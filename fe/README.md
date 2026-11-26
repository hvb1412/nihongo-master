# Frontend Nihongo Master

Chạy các lệnh tại `nihongo-master/fe` với Node.js 22.19 trở lên trong nhánh 22. Dùng `npm` thay cho `npm.cmd` trên Bash.

## Chạy trên máy

Khởi động [API](../be/README.md) rồi chạy frontend.

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở `http://127.0.0.1:4175`. Vite chuyển `/api` tới `http://127.0.0.1:4000`. Có thể đặt `DEV_API_TARGET` trong `.env` của `fe` khi API nghe ở địa chỉ khác. Tham khảo [.env.example](.env.example).

## Deploy trên Vercel

| Mục | Giá trị |
| --- | --- |
| Root Directory | `fe` |
| Framework Preset | Vite |
| Install Command | `npm ci --include=dev` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

[vercel.mjs](vercel.mjs) cấu hình build và chuyển tiếp toàn bộ đường dẫn `/api/*` sang Render. Trong **Settings → Environment Variables**, đặt `API_ORIGIN` bằng domain HTTPS của Render và bỏ phần `/api` ở cuối. Để trống `VITE_API_URL` để trình duyệt dùng `/api` cùng domain. Đặt `API_ORIGIN` cho mỗi môi trường Vercel bạn deploy, rồi kiểm tra cả `/api/health` và `/api/catalog/book/VOCABULARY?page=1&limit=8` trên domain Vercel. [Rewrite sang dịch vụ bên ngoài trên Vercel](https://vercel.com/docs/routing/rewrites#rewrites-to-external-origins)

## Kiểm thử

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Chạy backend với dữ liệu kiểm thử, cài trình duyệt bằng `npx playwright install chromium` và chạy `npm.cmd run test:e2e` khi frontend đã mở ở cổng `4175`. Có thể dùng `npm.cmd run preview` để kiểm thử bản build. Đặt `E2E_BASE_URL` khi giao diện chạy ở địa chỉ khác. Đặt `PLAYWRIGHT_BROWSER_CHANNEL` thành `chrome` hoặc `msedge` để dùng trình duyệt đã cài.
