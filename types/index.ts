export type MessageRole = 'system' | 'user' | 'assistant';

export interface PromptMessage {
    role: MessageRole;
    content: string;
}

export type LLMResponse<T> =
    | { status: 'success'; data: T; isCached: boolean }
    | { status: 'error'; error: Error; code: string };

export function isLLMSuccess<T>(res: LLMResponse<T>): res is { status: 'success'; data: T; isCached: boolean } {
    return res.status === 'success';
}