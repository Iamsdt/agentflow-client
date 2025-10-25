import { ResponseMetadata } from './metadata.js';
import { Message } from '../message.js';

export interface CheckpointMessagesContext {
    baseUrl: string;
    authToken?: string | null;
    timeout: number;
    debug: boolean;
}

export interface CheckpointMessagesRequest {
    threadId: string | number;
    search?: string;
    offset?: number;
    limit?: number;
}

export interface CheckpointMessagesData {
    messages: Message[];
}

export interface CheckpointMessagesResponse {
    data: CheckpointMessagesData;
    metadata: ResponseMetadata;
}

export async function checkpointMessages(
    context: CheckpointMessagesContext,
    request: CheckpointMessagesRequest
): Promise<CheckpointMessagesResponse> {
    try {
        if (context.debug) {
            console.debug('AgentFlowClient: Fetching checkpoint messages for thread', request.threadId);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        // Build query parameters
        const params = new URLSearchParams();
        if (request.search !== undefined) {
            params.append('search', request.search);
        }
        if (request.offset !== undefined) {
            params.append('offset', request.offset.toString());
        }
        if (request.limit !== undefined) {
            params.append('limit', request.limit.toString());
        }

        const queryString = params.toString();
        const url = `${context.baseUrl}/v1/threads/${request.threadId}/messages${queryString ? '?' + queryString : ''}`;

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
            console.warn(`AgentFlowClient: Checkpoint messages fetch failed with HTTP ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CheckpointMessagesResponse = await response.json();

        if (context.debug) {
            console.info('AgentFlowClient: Checkpoint messages fetched successfully', data);
        }

        return data;
    } catch (error) {
        if (context.debug) {
            console.debug('AgentFlowClient: Checkpoint messages fetch failed:', error);
        }
        throw error;
    }
}
