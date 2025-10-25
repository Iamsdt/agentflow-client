import { ResponseMetadata } from './metadata.js';
import { Message } from '../message.js';

export interface ThreadMessageContext {
    baseUrl: string;
    authToken?: string | null;
    timeout: number;
    debug: boolean;
}

export interface ThreadMessageRequest {
    threadId: string | number;
    messageId: string;
}

export interface ThreadMessageData extends Message {
    // This extends the Message class to ensure type compatibility
    // The API returns a message object directly as data
}

export interface ThreadMessageResponse {
    data: ThreadMessageData;
    metadata: ResponseMetadata;
}

export async function threadMessage(
    context: ThreadMessageContext,
    request: ThreadMessageRequest
): Promise<ThreadMessageResponse> {
    try {
        if (context.debug) {
            console.debug(
                'AgentFlowClient: Fetching thread message',
                `thread: ${request.threadId}`,
                `message: ${request.messageId}`
            );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const url = `${context.baseUrl}/v1/threads/${request.threadId}/messages/${request.messageId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(context.authToken && { 'Authorization': `Bearer ${context.authToken}` })
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(
                `AgentFlowClient: Thread message fetch failed with HTTP ${response.status}`
            );
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ThreadMessageResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Thread message fetched successfully', data);
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: Thread message fetch failed:', error);
        }
        throw error;
    }
}
