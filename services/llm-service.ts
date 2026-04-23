import { Queue, Worker as BullWorker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import CircuitBreaker from 'opossum';
import { EventEmitter } from 'events';
import { PromptMessage, LLMResponse, isLLMSuccess } from '../types'; // Import types từ File 1

export interface ILLMProvider {
    generateCompletion<T>(messages: PromptMessage[]): Promise<T>;
}

export class EnterpriseLLMService {
    private llmQueue: Queue;
    private pubSub: EventEmitter;
    private circuitBreaker: CircuitBreaker<[PromptMessage[]], unknown>;

    // Dependency Injection (Constructor Injection)
    constructor(
        private readonly redisClient: Redis,
        private readonly llmProvider: ILLMProvider,
        queueName: string = 'llm-background-tasks'
    ) {
        // Khởi tạo Pub/Sub
        this.pubSub = new EventEmitter();

        // Khởi tạo BullMQ
        this.llmQueue = new Queue(queueName, { connection: this.redisClient });

        // Khởi tạo Circuit Breaker bảo vệ API
        this.circuitBreaker = new CircuitBreaker(
            (msgs: PromptMessage[]) => this.llmProvider.generateCompletion(msgs),
            {
                timeout: 15000,             // Ngắt kết nối nếu quá 15s
                errorThresholdPercentage: 50, // Mở mạch nếu lỗi > 50%
                resetTimeout: 30000         // Thử lại sau 30s
            }
        );

        this.circuitBreaker.fallback(() => { throw new Error('Circuit Breaker is OPEN. API is down.'); });

        // Pub/Sub Events
        this.circuitBreaker.on('open', () => this.pubSub.emit('alert', 'LLM_CIRCUIT_OPENED'));
        this.circuitBreaker.on('halfOpen', () => this.pubSub.emit('info', 'LLM_CIRCUIT_HALF_OPEN'));
    }

    /**
     * Xử lý Đồng bộ (Bảo vệ bởi Cache-Aside)
     */
    public async executePrompt<T>(cacheKey: string, messages: PromptMessage[]): Promise<LLMResponse<T>> {
        const fullCacheKey = `llm_cache:${cacheKey}`;

        try {
            // 1. Kiểm tra Redis Cache
            const cachedData = await this.redisClient.get(fullCacheKey);
            if (cachedData) {
                return { status: 'success', data: JSON.parse(cachedData) as T, isCached: true };
            }

            // 2. Gọi API thông qua Circuit Breaker
            const result = await this.circuitBreaker.fire(messages) as T;

            // 3. Ghi vào Cache (TTL: 1 giờ)
            await this.redisClient.set(fullCacheKey, JSON.stringify(result), 'EX', 3600);

            return { status: 'success', data: result, isCached: false };
        } catch (error) {
            return {
                status: 'error',
                error: error instanceof Error ? error : new Error('Unknown Error'),
                code: 'EXECUTION_FAILED'
            };
        }
    }

    /**
     * Xử lý Bất đồng bộ (Hàng đợi BullMQ)
     */
    public async enqueueTask(jobId: string, messages: PromptMessage[]): Promise<void> {
        await this.llmQueue.add('process-llm-task', { messages }, {
            jobId: jobId, // Tính Idempotent (Chống trùng lặp)
            attempts: 5,  // Cơ chế Retries
            backoff: {
                type: 'exponential', // Exponential Backoff
                delay: 2000
            },
            removeOnComplete: true,
            removeOnFail: false // Đẩy lỗi vào Dead Letter Queue (DLQ)
        });

        this.pubSub.emit('info', `Job ${jobId} successfully enqueued.`);
    }

    /**
     * Khởi tạo Worker xử lý Background Tasks
     */
    public startQueueWorker(queueName: string): BullWorker {
        const worker = new BullWorker(queueName, async (job: Job) => {
            // Gọi lại hàm executePrompt, tự động xử lý Cache và Circuit Breaker
            const response = await this.executePrompt(`job_result:${job.id}`, job.data.messages);

            if (!isLLMSuccess(response)) {
                throw response.error; // Quăng lỗi để BullMQ kích hoạt Retry hoặc đưa vào DLQ
            }
            return response.data;
        }, { connection: this.redisClient });

        worker.on('failed', (job, err) => {
            this.pubSub.emit('error', `DLQ Alert: Job ${job?.id} permanently failed: ${err.message}`);
        });

        return worker;
    }
}