# VIET69 (dự án mẫu)

Dự án dựng lại bố cục, điều hướng và luồng click của một website video, dùng **dữ liệu giả lập**. Không chứa video, ảnh hay bài viết của website gốc, không có banner quảng cáo.

## Chạy local

```
npm install
npm run dev
```

Mở địa chỉ Vite in ra (mặc định http://localhost:5173).

## Build

```
npm run build
npm run preview
```

## Cấu trúc route

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang chủ, sắp xếp `?sort=` và phân trang `?page=` |
| `/video/:id` | Chi tiết video, video liên quan (cùng danh mục hoặc cùng thẻ), bình luận |
| `/category`, `/category/:slug` | Danh mục |
| `/tags`, `/tag/:slug` | Thẻ |
| `/authors`, `/author/:name` | Tác giả |
| `/search?q=` | Tìm kiếm |
| `/lienhe`, `/contact`, `/about`, `/privacy`, `/terms` | Trang tĩnh |
| `/login`, `/register` | Trang giữ chỗ, chưa nối backend |
| `*` | 404 |

Các đường dẫn menu như `/sex-viet`, `/camera` chuyển hướng tới đúng danh mục; `/teen`, `/thu-dam` trỏ tới trang thẻ tương ứng (trên web nguồn đây là trang thẻ, không phải danh mục).

## Dữ liệu

Nội dung nằm trong `src/data/*.json` (video, danh mục, thẻ, tác giả), được sinh từ script **scraper** (bên dưới). Giao diện đọc thẳng JSON lúc build — không cần backend.

### Web nguồn (tên miền)
Tên miền nguồn nằm riêng trong `src/config.ts` (dùng cho frontend):
- `SOURCE_BASE` — web chính/nguồn (hiện `https://viet69.be`).
- `EMBED_BASE` — server embed video (hiện `https://emb.cd-vs.com`).

Khi nguồn đổi tên miền: sửa `src/config.ts` (video "emb" sẽ tự cập nhật vì URL được ghép từ `EMBED_BASE` + uuid). Video "thành viên" và "cũ" lưu URL sẵn trong data → muốn đổi thì chạy lại scraper với `BASE` mới trong `scripts/scrape.mjs`.

### Cách phát video
Video được **embed** từ nguồn (không tải file về web mình):
- **Video chính (emb)**: 2 server như web gốc.
  - **Server #1**: link player Blogger đã lưu sẵn trong data (`serverUrls`) — trang player sạch, **không quảng cáo, phát được ngay trên web mình** (bấm nút ▶ trong khung).
  - **Server #2**: iframe embed của nguồn (`https://emb.cd-vs.com/embed/{uuid}`) — host chỉ gửi player cho web có referer `viet69.be`, nên trên web mình dùng làm dự phòng.
  - Nút **Xem trên nguồn ↗** mở bài gốc trong tab mới (luôn phát được).
- **Video cũ (direct)**: iframe trực tiếp nguồn (vd `xvideos.com/embedframe/...`) — phát bình thường.
- **Video thành viên (member)**: iframe trang gốc `https://viet69.be/bai-viet/{slug}/` (vì file HLS cần referer nguồn) — phát bình thường, có quảng cáo của trang gốc.

Link server #1 được lấy bằng `scripts/scrape_servers.mjs`: gọi API `get-video` của `emb.cd-vs.com` cho từng video emb rồi lưu vào `serverUrls` (chạy lại được, video đã có link bị bỏ qua).

## Scraper / đồng bộ nội dung

Script `scripts/scrape.mjs` (Node + cheerio) lấy nội dung từ viet69.be và ghi lại `src/data/*.json` + `public/sitemap.xml`.

```bash
# Crawl 500 video mới nhất (nhanh, để có dữ liệu trước khi up)
node scripts/scrape.mjs --limit 500

# Crawl toàn bộ (~22.090 video chính + ~2.424 video thành viên), có resume
node scripts/scrape.mjs --full

# Lấy video MỚI từ trang chủ, merge vào data hiện có (dùng khi muốn cập nhật)
node scripts/scrape.mjs --sync
```

Sau khi chạy scraper, chạy lại `npm run build` để đóng gói dữ liệu mới. Tiến độ crawl được lưu ở `data/cache/progress.json` (chạy lại `--full` sẽ tiếp tục, không lặp lại).

**Lưu ý:**
- Crawl theo `sitemap.xml` của nguồn (cho phép trong robots.txt). Video mới phát hiện qua trang chủ (sắp xếp mới nhất trước).
- `views` lấy từ trang chi tiết, có thể lệch nhẹ (trang nguồn động). `likes`, ngày đăng, danh mục, thẻ, tác giả đều chính xác.
- Muốn cập nhật video mới thường xuyên: chạy `node scripts/scrape.mjs --sync` rồi `npm run build`. Có thể lên lịch bằng Task Scheduler / cron.

## Việc cần bạn xác nhận

- Nếu muốn dùng video/ảnh thật, chỉ dùng nội dung bạn sở hữu hoặc có giấy phép.
- Thay `https://viet69-clone.example.com` trong `index.html`, `public/sitemap.xml`, `public/robots.txt` bằng tên miền thật khi deploy.
- Trang chỉ dành cho người từ 18 tuổi trở lên; hãy bổ sung cổng xác nhận tuổi và kiểm duyệt nội dung theo quy định pháp luật trước khi công khai.

## Chưa làm

- Backend thật: `src/api/index.ts` mới là bản thiết kế API mẫu, giao diện hiện đọc thẳng từ JSON.
- Đăng nhập/đăng ký, đăng video, lưu bình luận bền vững.