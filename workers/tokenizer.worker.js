import { parentPort, workerData } from 'worker_threads';

// Giả lập logic đếm token (Bạn có thể cài thư viện tiktoken ở đây)
const text = workerData.text;
const estimatedTokens = Math.ceil(text.length / 4);

// Gửi kết quả về cho luồng chính
parentPort.postMessage(estimatedTokens);