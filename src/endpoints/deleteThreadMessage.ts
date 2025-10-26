import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';

export interface DeleteThreadMessageContext {
    baseUrl: string;
    authToken?: string | null;
    timeout: number;
    debug: boolean;
}

export interface DeleteThreadMessageRequest {
    threadId: string | number;
    messageId: string;
    config?: Record<string, any>;
}

export interface DeleteThreadMessageData {
    success: boolean;
    message: string;
    data: Record<string, any>;
}

export interface DeleteThreadMessageResponse {
    data: DeleteThreadMessageData;
    metadata: ResponseMetadata;
}

export async function deleteThreadMessage(
    context: DeleteThreadMessageContext,
    request: DeleteThreadMessageRequest
): Promise<DeleteThreadMessageResponse> {
    try {
        if (context.debug) {
            console.debug(
                'AgentFlowClient: Deleting thread message',
                `thread: ${request.threadId}`,
                `message: ${request.messageId}`
            );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const url = `${context.baseUrl}/v1/threads/${request.threadId}/messages/${request.messageId}`;

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
                `AgentFlowClient: Delete thread message failed with HTTP ${response.status}`
            );
            const error = await createErrorFromResponse(response, 'Delete thread message failed');
            throw error;
        }

        const data: DeleteThreadMessageResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Thread message deleted successfully', data);
        }

        return data;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.warn(`AgentFlowClient: Delete thread message timeout after ${context.timeout}ms`);
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }
        if (context.debug) {
            console.debug('AgentFlowClient: Delete thread message failed:', error);
        }
        throw error;
    }
}
