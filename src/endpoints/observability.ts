import { ResponseMetadata } from './metadata.js';
import { createErrorFromResponse } from '../errors.js';
import { buildHeaders, getRequestCredentials, RequestContext } from '../request.js';

export interface ObservabilityContext extends RequestContext {}

export interface ObsSpan {
    id: string;
    name: string;
    kind: 'root' | 'node' | 'llm' | 'tool';
    parent: string | null;
    start_ms: number;
    duration_ms: number;
    model?: string | null;
    input_tokens?: number | null;
    output_tokens?: number | null;
}

export interface ObsEvent {
    id: string;
    type: string;
    node: string;
    offset_ms: number;
    summary: string;
}

export interface ObsTokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    reasoning_tokens: number;
    total_tokens: number;
}

export interface ObsRun {
    run_id: string;
    thread_id: string;
    status: string;
    started_at: number | null;
    finished_at: number | null;
    duration_ms: number;
    spans: ObsSpan[];
    events: ObsEvent[];
    usage: ObsTokenUsage;
    llm_calls: number;
    tool_calls: number;
    iterations: number;
}

export interface ObservabilityData {
    thread_id: string;
    run_count: number;
    run_ids: string[];
    run: ObsRun | null;
}

export interface ObservabilityResponse {
    data: ObservabilityData;
    metadata: ResponseMetadata;
}

/**
 * Fetch the reconstructed observability trace (spans, events, cost) for a thread.
 * Returns the latest run by default, or a specific run when `runId` is given.
 */
export async function observability(
    context: ObservabilityContext,
    threadId: string,
    runId?: string
): Promise<ObservabilityResponse> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout);

        const query = runId ? `?run_id=${encodeURIComponent(runId)}` : '';
        const response = await fetch(
            `${context.baseUrl}/v1/observability/${encodeURIComponent(threadId)}${query}`,
            {
                method: 'GET',
                headers: buildHeaders(context as RequestContext, {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                }),
                ...getRequestCredentials(context as RequestContext),
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await createErrorFromResponse(
                response,
                'Observability fetch failed',
                `/v1/observability/${threadId}`,
                'GET'
            );
            throw error;
        }

        return (await response.json()) as ObservabilityResponse;
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            throw new Error(`Request timeout after ${context.timeout}ms`);
        }
        throw error;
    }
}
