# Nihongo Master

Website tự học tiếng Nhật bằng tiếng Việt với năm phần Từ vựng, Ngữ pháp, Kanji, Luyện đọc và Luyện nghe theo cấp JLPT N5–N1.

| Dự án | Nội dung | Root Directory khi deploy |
| --- | --- | --- |
| [fe](fe/README.md) | React, Vite, tài nguyên giao diện, kiểm thử Chrome và proxy `/api` | Vercel chọn `fe` |
| [be](be/README.md) | Express, Prisma, PostgreSQL, dữ liệu, migration và seed | Render chọn `be` |

Mỗi dự án cài dependencies bằng `npm ci` từ thư mục của mình. Cần Node.js 22.19 trở lên trong nhánh 22.

## Chạy trên máy

Chuẩn bị Neon hoặc PostgreSQL theo [hướng dẫn backend](be/README.md). Mở một terminal trong `nihongo-master` để chạy API.

```powershell
cd be
npm.cmd ci
npm.cmd run db:generate
npm.cmd run dev
```

Mở terminal thứ hai trong `nihongo-master` để chạy frontend.

```powershell
cd fe
npm.cmd ci
npm.cmd run dev
```

- [Giao diện](http://127.0.0.1:4175)
- [Kiểm tra kết nối database](http://127.0.0.1:4000/api/health)
- Trên Bash, dùng `npm` thay cho `npm.cmd`.

## Nội dung học

| Mục | Nội dung |
| --- | --- |
| Từ vựng | Cách viết, cách đọc, âm Hán Việt, nghĩa tiếng Việt và câu ví dụ |
| Ngữ pháp | Công thức, cách dùng và ví dụ song ngữ |
| Kanji | Âm Hán Việt, âm On/Kun, bộ thủ, thứ tự nét và bảng luyện viết |
| Luyện đọc | Bài đọc tiếng Nhật, bản dịch tiếng Việt, Furigana và tra từ trong bài |
| Luyện nghe | Âm thanh tiếng Nhật, tốc độ phát, bản chép lời và bản dịch |
| Flash Card | Ôn từ vựng hoặc Kanji, lọc theo cấp JLPT |

Ô tra cứu Nhật–Việt nhận Kanji, Kana, Romaji và tiếng Việt có dấu hoặc không dấu. Nhập `勉強` để xem mục từ và hai chữ `勉`, `強`.

Chọn **Mở mục** để xem chi tiết và từng chữ Kanji trong popup. Dùng **Lưu** để thêm mục vào danh sách **Đã lưu**. Dùng **Học đến đây** và **Học tiếp** để quay lại vị trí riêng của Từ vựng, Ngữ pháp và Kanji. Các mục đã lưu và mốc học được giữ trên cùng trình duyệt.

Bộ dữ liệu từ điển gồm 10.723 mục. Trang chi tiết ghi rõ các nghĩa dịch tự động. [Nguồn và giấy phép](be/docs/DATA.md)
