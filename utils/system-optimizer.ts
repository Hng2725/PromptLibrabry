import { Worker } from 'worker_threads';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline, Transform } from 'stream';
import { promisify } from 'util';
import path from 'path'; // Thêm thư viện path để lấy đường dẫn chuẩn

const pipelineAsync = promisify(pipeline);

export class SystemOptimizer {
    static async processLargeDataset(inputPath: string, outputPath: string): Promise<void> {
        const readStream = createReadStream(inputPath, { encoding: 'utf8' });
        const writeStream = createWriteStream(outputPath);

        const dataTransformer = new Transform({
            objectMode: true,
            transform(chunk: string, encoding, callback) {
                // Ví dụ: Làm sạch dữ liệu trước khi feed vào LLM
                const cleanedData = chunk.split('\n').filter(line => line.trim().length > 0).join('\n');
                this.push(cleanedData + '\n');
                callback();
            }
        });

        await pipelineAsync(readStream, dataTransformer, writeStream);
    }

    static calculateTokensInWorker(text: string): Promise<number> {
        return new Promise((resolve, reject) => {
            // Trỏ đúng đường dẫn tuyệt đối đến file worker
            const workerPath = path.resolve(__dirname, '../workers/tokenizer.worker.js');
            const worker = new Worker(workerPath, { workerData: { text } });

            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }
}