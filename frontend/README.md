# Frontend - CLB Sách Lục Nam

Frontend application được xây dựng với Next.js 14 và React.

## Cấu trúc thư mục

```
frontend/
├── app/                 # Next.js App Router
│   ├── components/     # React components
│   ├── qr/             # Trang tạo mã QR
│   ├── muon/           # Trang mượn sách
│   ├── tra/            # Trang trả sách
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page (Dashboard)
│   └── globals.css     # Global styles
├── public/             # Static files
│   ├── icon.jpg
│   └── image/          # Images
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── start-dev.bat       # Script để chạy dev server (Windows)
└── start-dev.ps1       # PowerShell script để chạy dev server
```

## Cài đặt

```bash
npm install
```

## Chạy development server

### Cách 1: Sử dụng npm (khuyến nghị)
```bash
npm run dev
```

### Cách 2: Sử dụng file batch (nếu gặp lỗi PowerShell)
**Trong PowerShell:**
```powershell
.\start-dev.bat
```

**Trong Command Prompt (cmd):**
```cmd
start-dev.bat
```

Hoặc double-click vào file `start-dev.bat` trong File Explorer.

### Cách 3: Sử dụng PowerShell script
```powershell
.\start-dev.ps1
```

**Lưu ý:** 
- Trong PowerShell, luôn thêm `.\` trước tên file (ví dụ: `.\start-dev.bat`)
- Nếu gặp lỗi PowerShell execution policy, bạn có thể:
  - Sử dụng Command Prompt (cmd) thay vì PowerShell
  - Hoặc chạy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (cần quyền admin)
  - Hoặc sử dụng `npm.cmd run dev` trực tiếp

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Build cho production

```bash
npm run build
npm start
```

## Công nghệ sử dụng

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 18** - UI library

