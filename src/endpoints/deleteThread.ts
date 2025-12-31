import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';

export interface DeleteThreadContext {
    baseUrl: string;
    authToken?: string | null;
    timeout: number;
    debug: boolean;
}

export interface DeleteThreadRequest {
    threadId: string | number;
    config?: Record<string, any>;
}

export interface DeleteThreadData {
    success: boolean;
    message: string;
    data: boolean;
}

export interface DeleteThreadResponse {
    data: DeleteThreadData;
    metadata: ResponseMetadata;
}

export async function deleteThread(
    context: DeleteThreadContext,
    request: DeleteThreadRequest
): Promise<DeleteThreadResponse> {
    try {
        if (context.debug) {
            console.debug(
                'AgentFlowClient: Deleting thread',
                `thread: ${request.threadId}`
            );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const url = `${context.baseUrl}/v1/threads/${request.threadId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                ...(context.authToken && { 'Authorization': `Bearer ${context.authToken}` })
            },
            body: JSON.stringify({ config: request.config || {} }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(
                `AgentFlowClient: Delete thread failed with HTTP ${response.status}`
            );
            const error = await createErrorFromResponse(response, 'Delete thread failed', '/v1/threads/{thread_id}', 'DELETE');
            throw error;
        }

        const data: DeleteThreadResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Thread deleted successfully', data);
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Delete thread timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }
        if (context.debug) {
            console.debug('AgentFlowClient: Delete thread failed:', error);
        }
        throw error;
    }
}
