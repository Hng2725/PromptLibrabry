Cấu trúc:

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
