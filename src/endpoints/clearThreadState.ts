import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';

export interface ClearThreadStateContext {
    baseUrl: string;
    authToken?: string | null;
    timeout: number;
    debug: boolean;
}

export interface ClearThreadStateData {
    success: boolean;
    message: string;
    data: boolean;
}

export interface ClearThreadStateResponse {
    data: ClearThreadStateData;
    metadata: ResponseMetadata;
}

export async function clearThreadState(
    context: ClearThreadStateContext,
    threadId: number
): Promise<ClearThreadStateResponse> {
    try {
        if (context.debug) {
            console.debug(`AgentFlowClient: Clearing thread state for thread ${threadId}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const response = await fetch(`${context.baseUrl}/v1/threads/${threadId}/state`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                ...(context.authToken && { 'Authorization': `Bearer ${context.authToken}` })
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`AgentFlowClient: Thread state clear failed with HTTP ${response.status}`);
            const error = await createErrorFromResponse(response, 'Thread state clear failed');
            throw error;
        }

        const data: ClearThreadStateResponse = await response.json();

        if (context.debug) {
            console.info(`AgentFlowClient: Thread state cleared successfully for thread ${threadId}`, data);
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Thread state clear timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }

        if (context.debug) {
            console.debug(`AgentFlowClient: Thread state clear failed:`, error);
        }

        throw error;
    }
}
