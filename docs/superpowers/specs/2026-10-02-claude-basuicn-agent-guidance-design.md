# Thiết kế lại tài liệu `.claude` và quy trình Basuicn

## 1. Mục tiêu

Chuẩn hóa `.claude/` thành một hệ thống tài liệu có router rõ ràng để AI agent chỉ đọc đúng ngữ cảnh cần thiết. Mọi công việc frontend phải ưu tiên component từ Basuicn. Nếu Basuicn không có component phù hợp, agent phải dừng và báo người dùng quyết định hướng UI, thay vì tự tạo primitive hoặc tự cài thư viện UI khác.

Thay đổi phải giữ tương thích với các prompt cũ đang tham chiếu các file Markdown hiện tại ở thư mục gốc `.claude/`.

## 2. Phạm vi

### Trong phạm vi

- Tổ chức lại tài liệu rule, workflow, step, pattern và project context trong `.claude/`.
- Thêm `.claude/CLAUDE.md` làm router chính.
- Viết quy tắc bắt buộc sử dụng Basuicn.
- Viết tài liệu để agent kiểm tra, cài và xác minh component Basuicn.
- Sửa đường dẫn trong các agent hiện có.
- Giữ các file Markdown cũ làm compatibility shim trỏ tới vị trí mới.

### Ngoài phạm vi

- Không chạy `npx basuicn init`, `add`, `update`, `remove` hay thay đổi component UI trong lần tổ chức tài liệu này.
- Không thay đổi source code trong `src/`.
- Không thay đổi cấu hình package, Next.js hoặc Tailwind.
- Không thiết kế thêm component cho Basuicn.

## 3. Nguồn sự thật

Quy trình Basuicn dựa trên repository chính thức:

- Repository: <https://github.com/huytq203/core-basuicn>
- README: <https://github.com/huytq203/core-basuicn/blob/main/README.md>
- CLI guide: <https://github.com/huytq203/core-basuicn/blob/main/README_CLI.md>
- Registry: <https://github.com/huytq203/core-basuicn/blob/main/registry.json>

Theo tài liệu hiện tại, Basuicn yêu cầu Node.js 18+, React 18+/19+, Vite hoặc Next.js và Tailwind CSS v4. CLI hỗ trợ `init`, `add`, `list`, `diff`, `update`, `remove` và `doctor`. Component được copy vào `src/components/ui/<name>/`, đồng thời CLI tự xử lý package và component phụ thuộc được khai báo trong registry.

## 4. Cấu trúc đích

```text
.claude/
├── CLAUDE.md
├── project-context/
│   └── CONTEXT.md
├── rules/
│   ├── RULE.md
│   └── BASUICN.md
├── workflows/
│   ├── frontend.md
│   ├── nextjs.md
│   └── react-vite.md
├── steps/
│   ├── new-feature.md
│   ├── new-component.md
│   ├── add-api-query.md
│   └── bugfix.md
├── patterns/
│   └── ui-components.md
├── agents/
│   ├── code-reviewer.md
│   ├── codex-implementer.md
│   ├── frontend-builder.md
│   └── ui-implementer.md
├── DESIGN.md
├── RULE.md
├── FE_WORKFLOW.md
├── WORKFLOW_NEXTJS.md
└── REACT-VITE-WORKFLOW.md
```

`DESIGN.md` tiếp tục là nguồn sự thật của design system hiện tại. Bốn file rule/workflow cũ được giữ lại làm compatibility shim ngắn, chỉ trỏ tới tài liệu canonical mới. Nội dung không được duy trì song song ở hai nơi để tránh lệch rule.

## 5. Trách nhiệm từng tài liệu

### `.claude/CLAUDE.md`

Router được agent đọc đầu tiên. File này mô tả thứ tự đọc tối thiểu:

1. Đọc project context.
2. Chọn đúng step theo loại task.
3. Đọc các rule và pattern mà step yêu cầu.
4. Đọc workflow framework tương ứng.
5. Với Next.js, đọc thêm tài liệu local trong `node_modules/next/dist/docs/` trước khi dùng API hoặc convention của framework.

### `project-context/CONTEXT.md`

Ghi stack và ranh giới kiến trúc thực tế của repository: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Basuicn, vị trí component UI và các lệnh kiểm tra. Không chứa quy tắc dài hoặc hướng dẫn task cụ thể.

### `rules/RULE.md`

Là nguồn sự thật duy nhất cho coding rules chung. Nội dung hiện có từ `.claude/RULE.md` được chuyển vào đây và chỉnh lại liên kết nội bộ.

### `rules/BASUICN.md`

Chứa chính sách bắt buộc sử dụng Basuicn, các hành động được phép và điểm phải dừng hỏi người dùng.

### `workflows/`

Chứa quy trình theo framework hoặc loại công việc. Nội dung hiện có được chuyển từ các file workflow gốc, loại bỏ trùng lặp với rule và thay bằng liên kết tới nguồn canonical.

### `steps/`

Mỗi file là checklist ngắn dành cho một loại task. Step chỉ dẫn agent tới đúng rule, workflow và pattern; không sao chép toàn bộ nội dung các file đó.

### `patterns/ui-components.md`

Là playbook thao tác Basuicn: kiểm tra local, kiểm tra registry, cài component, xác minh và xử lý trường hợp thiếu component.

## 6. Chính sách Basuicn bắt buộc

Khi task cần UI primitive hoặc component dùng lại, agent phải thực hiện theo thứ tự:

1. Xác định tên và khả năng UI cần dùng.
2. Kiểm tra component đã có trong `src/components/ui/<name>/` hay chưa.
3. Nếu chưa có local, chạy `npx basuicn list` để kiểm tra registry hiện hành.
4. Nếu registry có component, đọc trợ giúp CLI khi cần rồi chạy `npx basuicn add <name>`.
5. Kiểm tra diff để bảo đảm CLI không ghi đè ngoài phạm vi dự kiến.
6. Chạy `npx basuicn doctor`, typecheck và lint.
7. Import và compose component đã cài trong feature; không sao chép lại primitive vào feature.

Agent không được:

- Tự viết lại một primitive đã tồn tại trong Basuicn.
- Tự cài một UI library khác để thay thế.
- Chạy `npx basuicn init` trên dự án đã được cấu hình mà chưa có xác nhận của người dùng.
- Chạy `update`, `remove` hoặc dùng `--force` nếu chưa có xác nhận, vì các lệnh này có thể ghi đè hoặc xóa source code local.
- Sửa rộng component dùng chung chỉ để đáp ứng một feature mà chưa đánh giá ảnh hưởng tới consumer khác.

## 7. Trường hợp Basuicn không có component

Nếu `npx basuicn list` hoặc registry chính thức không có component phù hợp, agent phải dừng trước khi viết UI thay thế và báo người dùng bằng mẫu:

```md
## Basuicn thiếu component

- Nhu cầu UI: <mô tả ngắn>
- Component đã kiểm tra: <tên hoặc nhóm component>
- Kết quả: không có component phù hợp trong Basuicn
- Phương án:
  1. Compose từ các primitive Basuicn hiện có.
  2. Tạo component mới trong dự án.
  3. Bổ sung component vào core-basuicn trước rồi cài qua CLI.
- Khuyến nghị: <một phương án và lý do>

Vui lòng chọn phương án trước khi agent tiếp tục phần UI.
```

Agent có thể tiếp tục phần không phụ thuộc quyết định UI nếu việc đó không tạo ra code tạm hoặc buộc trước một phương án.

## 8. Hướng dẫn cài đặt dành cho agent

`patterns/ui-components.md` phải phân biệt hai tình huống:

### Dự án chưa khởi tạo Basuicn

Agent kiểm tra `package.json`, `src/components/ui`, core files, ThemeProvider, CSS và path alias. Nếu thực sự chưa khởi tạo, agent phải báo những thay đổi dự kiến và xin xác nhận trước khi chạy:

```bash
npx basuicn init
```

Sau đó chạy:

```bash
npx basuicn doctor
```

### Dự án đã có Basuicn

Không chạy lại `init`. Dùng:

```bash
npx basuicn list
npx basuicn add <component>
npx basuicn doctor
npm run typecheck
npm run lint
```

`npx basuicn diff <component>` được dùng để xem chênh lệch giữa source local và registry. `update`, `remove` và `--force` là thao tác có khả năng phá hủy chỉnh sửa local nên luôn cần người dùng xác nhận mục tiêu cụ thể.

## 9. Cập nhật agents

Các file trong `.claude/agents/` phải:

- Trỏ tới `.claude/CLAUDE.md` trước tiên.
- Không tham chiếu đường dẫn không tồn tại.
- Đọc `rules/BASUICN.md` và `patterns/ui-components.md` khi task có UI.
- Không tuyên bố rằng `src/components/ui/` tuyệt đối không được sửa; component do Basuicn copy vào dự án thuộc quyền sở hữu của dự án. Tuy nhiên, thay đổi component dùng chung phải có lý do và được kiểm tra ảnh hưởng.
- Áp dụng đúng điểm dừng khi Basuicn thiếu component.

## 10. Tương thích ngược

Các file cũ được thay bằng compatibility shim có cấu trúc:

```md
# Đã chuyển tài liệu

Nguồn canonical: [đường dẫn mới](đường-dẫn-tương-đối).
AI agent phải đọc và tuân theo file canonical; không duy trì rule tại file này.
```

Không xóa file cũ để prompt, IDE bookmark hoặc agent definition hiện tại không bị hỏng ngay lập tức.

## 11. Xác minh

Sau khi triển khai:

1. Liệt kê toàn bộ file trong `.claude/` và xác nhận cấu trúc đích tồn tại.
2. Dùng tìm kiếm để bảo đảm không còn liên kết nội bộ tới file hoặc thư mục không tồn tại.
3. Xác nhận mọi step đều dẫn tới ít nhất một rule/workflow hợp lệ.
4. Xác nhận tất cả agent liên quan UI đều đọc chính sách Basuicn.
5. Xác nhận các compatibility shim trỏ đúng đường dẫn.
6. Chạy kiểm tra Markdown/link nội bộ bằng script read-only hoặc shell check phù hợp.
7. Không yêu cầu build ứng dụng vì thay đổi chỉ tác động tài liệu; typecheck/lint chỉ cần chạy khi quy trình Basuicn thực sự cài hoặc thay component source.

## 12. Tiêu chí hoàn thành

- Agent mới có một entry point rõ ràng tại `.claude/CLAUDE.md`.
- Không còn đường dẫn tài liệu bị hỏng trong `.claude/agents/`.
- Basuicn là lựa chọn bắt buộc đầu tiên cho UI component.
- Khi Basuicn thiếu component, agent dừng và xin quyết định của người dùng.
- Agent có hướng dẫn chính xác để kiểm tra, cài và xác minh Basuicn trên Next.js hoặc Vite.
- Prompt cũ vẫn tìm thấy các file Markdown ở vị trí cũ.
