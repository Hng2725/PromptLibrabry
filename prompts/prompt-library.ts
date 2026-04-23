import { PromptMessage } from '../types';

export const getLogAnalysisPrompt = (rawLog: string): PromptMessage[] => [
    {
        role: 'system',
        content: 'You are an expert DevOps AI. Extract error details. You MUST return ONLY valid JSON matching this schema: { "errorCode": string, "severity": "LOW" | "HIGH" | "CRITICAL", "rootCause": string }. Do NOT wrap the output in markdown code blocks. Output plain raw JSON string only.'
    },
    // Few-shot example
    { role: 'user', content: 'Log: [ERR] DB_TIMEOUT at 10:04 PM. Connection pool exhausted.' },
    { role: 'assistant', content: '{"errorCode": "DB_TIMEOUT", "severity": "CRITICAL", "rootCause": "Connection pool exhausted"}' },
    // Real input
    { role: 'user', content: `Log: ${rawLog}` }
];

export const getCodeOptimizationPrompt = (sourceCode: string): PromptMessage[] => [
    {
        role: 'system',
        content: `You are a Principal Software Engineer. When reviewing code, think step-by-step:
                1. Analyze the Time (Big O) and Space Complexity.
                2. Identify performance bottlenecks.
                3. Propose an optimized algorithm.
                4. Output the refactored code enclosed strictly within a single markdown code block.`
    },
    { role: 'user', content: `Optimize this source code:\n\n${sourceCode}` }
];