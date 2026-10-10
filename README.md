# Chaoslong's website

Website ghi lại hành trình dự án với bốn phần: **Home**, **Team**, **Work**, **Finish Work**. Thiết kế nền tối, tím và xanh nhạt; minh họa SVG riêng. Forma là tên nhóm mẫu, có thể sửa trên website.

Website có hai không gian chuyển qua thanh trên cùng: **Projects** cho các dự án/nhóm, **Personal Blog** cho riêng chaos-long. Bài viết blog cá nhân lưu riêng với các báo cáo tuần.

## Blog cá nhân và ảnh nền

Blog có banner phong cảnh, danh sách bài viết, tìm kiếm, lưu trữ theo năm, chuyên mục, thẻ và trang Về mình. Mỗi bài có ngày, chuyên mục, thẻ, nội dung và media. Nội dung hỗ trợ tiêu đề, danh sách và các đoạn code đặt giữa hai dòng có ba dấu backtick.

Khi đã kết nối quản trị, chọn **Personal Blog → Sửa giới thiệu / đổi ảnh nền**. Có thể tải ảnh lên (tối đa 20 MB) hoặc nhập link HTTPS. File nền mới được lưu trong GitHub cùng lần cập nhật blog. Có thể gỡ ảnh để dùng nền màu mặc định. Ảnh nền ban đầu `assets/blog-cover.jpg` được lấy từ [blog tham khảo](https://loboq1ng.github.io/) theo yêu cầu của chủ website; không sử dụng ảnh do AI tạo. [Ảnh nguồn](https://loboq1ng.github.io/img/Whale.jpg).

## Quyền chỉnh sửa

Trên bản host thật, chỉ tài khoản GitHub **chaos-long** được kết nối quyền quản trị. Website xác minh chủ token qua API `GET /user`, kiểm tra quyền ghi của repository rồi mới mở chức năng sửa. Các thao tác ghi vào GitHub vẫn yêu cầu token có quyền Contents; người xem chỉ có thể đọc. Không cấp quyền cộng tác ghi vào repository cho tài khoản khác nếu muốn giữ quyền sở hữu nội dung duy nhất.

Nút thử chỉnh sửa bằng IndexedDB chỉ xuất hiện khi chạy trên `localhost` hoặc `127.0.0.1`. Bản public không nạp bản sửa cục bộ và không có nút chỉnh sửa thử cho khách. Đây là quyền **đăng/sửa**, không phải giới hạn người đọc; các bài được đăng trên website public sẽ xem được công khai.

## Nhiều dự án, nhiều đội ngũ

Nút **Dự án ⌄** trên đầu trang mở danh sách các dự án. Mỗi dự án có giới thiệu Home, danh sách Team, bài viết Work và sản phẩm Finish Work riêng.

- **Tạo dự án mới:** bật chỉnh sửa bản xem thử hoặc kết nối GitHub, bấm **Dự án → Tạo dự án mới**. Dự án mới bắt đầu với đội ngũ và bài viết trống; dữ liệu cũ không bị thay thế.
- **Chuyển dự án:** chọn **Mở dự án**. Không cần lưu hay đăng nhập để xem các dự án đã công bố.
- **Lưu trữ:** chuyển dự án cũ sang danh sách **Đã lưu trữ**, vẫn xem và mở được đầy đủ nội dung/media.
- **Khôi phục:** đưa dự án đã lưu trữ trở lại danh sách đang thực hiện.
- Link website có tham số `?project=...`, có thể chia sẻ link tới đúng dự án và đúng bài viết.

Toàn bộ thư viện dự án lưu trong `content.json` và GitHub. Sao lưu nội dung trong khu vực quản lý tải cả thư viện. Dữ liệu định dạng cũ một dự án được tự chuyển sang thư viện khi đọc, không mất đội ngũ hay bài viết.

## Chạy trên GitHub Pages

Mã nguồn đặt ở thư mục gốc repository `chaos-long/chaoslong-website`, nhánh `main`.

1. Vào **Settings → Pages** của repository.
2. Chọn **Source: GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` triển khai website sau mỗi lần cập nhật `main`.
4. Link dự kiến: `https://chaos-long.github.io/chaoslong-website/`. Chỉ sử dụng khi Pages đã triển khai thành công.

Không cần cài thư viện hoặc chạy build. Các đường dẫn tương đối và điều hướng bằng hash hoạt động cả khi website nằm trong thư mục con của GitHub Pages.

## Sửa nội dung ngay trên web

1. Bấm **Quản lý website** ở chân trang.
2. Chọn **Thử chỉnh sửa trên máy này** để thử; dữ liệu lưu trong IndexedDB của trình duyệt, chưa công khai. Không cần tài khoản.
3. Để đăng thật, dùng **Kết nối GitHub**. Tạo fine-grained personal access token trong cài đặt GitHub, chỉ chọn repository này, quyền **Contents: Read and write**, đặt thời hạn. Nhập token trực tiếp vào website, không gửi qua chat. Nếu repo thuộc tổ chức, token có thể cần phê duyệt theo chính sách tổ chức.
4. Kết nối xong, dùng các nút **Chỉnh sửa**, **Thêm thành viên**, **Viết báo cáo tuần**. Nút **Đăng lên GitHub** tạo một commit chứa nội dung và media. Chờ workflow Pages hoàn thành để khách thấy thay đổi.

Token chỉ giữ trong bộ nhớ tab, chỉ gửi tới API GitHub, không nằm trong mã nguồn, localStorage, IndexedDB hay bản sao nội dung. Tải lại trang hoặc ngắt kết nối sẽ xóa phiên. Người xem chưa kết nối không có quyền ghi vào repository. Token của tài khoản khác chaos-long bị từ chối trước khi tải nội dung quản trị.

## Ảnh và video

- Ảnh: JPG, PNG, WebP, GIF, AVIF.
- Video tải trực tiếp: MP4, WebM, OGG. Khuyến nghị MP4 để tương thích rộng.
- Mỗi file tối đa 20 MB, tổng file mới mỗi lần đăng tối đa 40 MB.
- Video dài: thêm link YouTube, Vimeo hoặc HTTPS trực tiếp tới file video.
- Ảnh đại diện thành viên, media của bài viết và sản phẩm đều chỉnh sửa được.
- File được lưu trong `media/`. Gỡ file khỏi bài viết chỉ gỡ tham chiếu; file và các commit cũ vẫn có trong lịch sử GitHub. Chỉ đưa nội dung bạn muốn công khai vào repository công khai.

## Nội dung và lưu trữ

`content.json` định dạng `schemaVersion: 2`, chứa mảng `projects`, mỗi dự án có ID riêng và thông tin giới thiệu, thành viên, bài viết, sản phẩm. Bài mẫu được đánh dấu **Mẫu**. Trình soạn hỗ trợ tiêu đề `##`, `###`, danh sách `-` và các đoạn văn; không chạy HTML do người viết nhập. Nội dung chữ toàn bộ thư viện tối đa 900 KB để kết nối API Contents tương thích.

Các file mới được gửi lên GitHub thành blob, sau đó nội dung và media được công bố trong cùng một commit. Nếu nội dung bị sửa bởi người khác hoặc nhánh không thể cập nhật, website giữ trình soạn mở và báo lỗi, không báo lưu thành công. Nhánh bảo vệ yêu cầu pull request có thể không cho đăng trực tiếp.

`config.json` chứa owner/repo/branch công khai, không chứa token. Trên miền `*.github.io`, owner và repo được tự nhận diện từ địa chỉ. Nếu đổi nhánh, sửa cả config và workflow cho khớp.

## Chạy thử trên máy

Dùng một HTTP static server ở thư mục mã nguồn, ví dụ `python -m http.server 8000`, rồi mở `http://localhost:8000`. Không mở trực tiếp file HTML bằng `file://` vì website cần tải JSON và JavaScript module.

## Tài liệu

- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Git database API](https://docs.github.com/en/rest/git)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
