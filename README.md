# Enterprise AI Core Services

Dự án này cung cấp các dịch vụ lõi (Core Services) dành cho ứng dụng AI, tập trung vào việc tối ưu hóa hiệu năng, xử lý hàng đợi, quản lý kết nối an toàn với LLM và thư viện Prompt chuẩn doanh nghiệp.

## Cấu trúc thư mục

```text
src/
└── ai/
    ├── types/
    │   └── index.ts               # File 1: Chứa các kiểu dữ liệu dùng chung
    ├── prompts/
    │   └── prompt-library.ts      # File 2: Chứa các kịch bản Prompt
    ├── utils/
    │   └── system-optimizer.ts    # File 3: Chứa logic Stream & Worker Threads
    ├── workers/
    │   └── tokenizer.worker.js    # File 4: File Worker thực thi tính toán nặng
    └── services/
        └── llm-service.ts         # File 5: Dịch vụ lõi (Queue, Circuit Breaker, Redis)
```
## Chi tiết các module

### 1. `types/index.ts`
Chứa các định nghĩa kiểu dữ liệu (Interfaces, Types, Enums) dùng chung cho toàn bộ dự án TypeScript. Đảm bảo tính nhất quán và type-safe khi truyền dữ liệu giữa các module.

### 2. `prompts/prompt-library.ts`
Thư viện quản lý các kịch bản Prompt (Prompt Templates). Áp dụng các kỹ thuật Prompt Engineering nâng cao như:
- **Role-based Persona:** Gán vai trò cụ thể cho AI (VD: Expert DevOps, Principal Software Engineer).
- **Few-shot Prompting:** Cung cấp ví dụ để AI trả về đúng định dạng mong muốn (VD: strict JSON).
- **Chain-of-Thought (CoT):** Yêu cầu mô hình "suy nghĩ" từng bước trước khi đưa ra kết quả, đặc biệt hiệu quả trong các tác vụ lập trình và phân tích logic.

### 3. `utils/system-optimizer.ts`
Module tối ưu hóa hệ thống để xử lý lượng dữ liệu khổng lồ:
- Tích hợp **Node.js Streams (`pipeline`, `Transform`)** để đọc/ghi file dung lượng lớn mà không làm tràn bộ nhớ (RAM).
- Triển khai **Worker Threads** để xử lý các tác vụ đa luồng, tránh làm block Main Thread của Event Loop.

### 4. `workers/tokenizer.worker.js`
Script chạy trên luồng phụ (Worker Thread), chuyên thực thi các tác vụ tính toán nặng nề như:
- Đếm số lượng Token của các đoạn văn bản khổng lồ.
- Chuẩn bị và tiền xử lý dữ liệu trước khi gửi lên LLM.

### 5. `services/llm-service.ts`
Dịch vụ giao tiếp với LLM API (OpenAI, Anthropic, OpenRouter, ...), được trang bị các cơ chế bảo vệ cấp doanh nghiệp:
- **Message Queue (BullMQ + Redis):** Quản lý hàng đợi request, hỗ trợ tự động gửi lại (retry logic) khi gặp lỗi mạng.
- **Rate Limiting:** Kiểm soát giới hạn số lượng request theo thời gian, tránh bị API chặn (HTTP 429).
- **Circuit Breaker:** Cơ chế ngắt mạch tự động ngừng gửi request khi API đích gặp sự cố liên tục, giúp hệ thống không bị treo.

## Yêu cầu hệ thống
- Node.js (phiên bản hỗ trợ Worker Threads và Streams, khuyên dùng v18+)
- Redis Server (dành cho BullMQ trong `llm-service.ts`)
- TypeScript
