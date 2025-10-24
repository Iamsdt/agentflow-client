import { ToolDefinition, ToolRegistration, ToolExecutor } from './tools.js';
import { Message } from './message.js';
import { ping, PingContext, PingResponse } from './endpoints/ping.js';
import { graph, GraphContext, GraphResponse } from './endpoints/graph.js';
import { stateSchema, StateSchemaContext, StateSchemaResponse } from './endpoints/stateSchema.js';
import { threadState, ThreadStateContext, ThreadStateResponse } from './endpoints/threadState.js';
import { updateThreadState, UpdateThreadStateContext, UpdateThreadStateRequest, UpdateThreadStateResponse } from './endpoints/updateThreadState.js';
import { 
    invoke as invokeEndpoint, 
    InvokeContext, 
    InvokeRequest, 
    InvokeResult,
    InvokeCallback,
    InvokePartialResult
} from './endpoints/invoke.js';
import {
    streamInvoke as streamInvokeEndpoint,
    StreamContext,
    StreamRequest,
    StreamChunk,
    StreamEventType
} from './endpoints/stream.js';

export interface AgentFlowConfig {
    baseUrl: string;
    authToken?: string | null;
    timeout?: number; // default 5min
    debug?: boolean;
}

export class AgentFlowClient {
    private baseUrl: string;
    private authToken?: string | null;
    private timeout: number;
    private debug: boolean;
    private toolExecutor: ToolExecutor;
    private toolRegistrations: ToolRegistration[];

    constructor(config: AgentFlowConfig) {
        this.baseUrl = config.baseUrl;
        this.authToken = config.authToken;
        this.timeout = config.timeout || 300000; // 5 min
        this.debug = config.debug || false;
        this.toolExecutor = new ToolExecutor([]);
        this.toolRegistrations = [];
    }

    /**
     * Register a tool for remote execution
     */
    registerTool(registration: ToolRegistration): void {
        this.toolRegistrations.push(registration);
        this.toolExecutor.registerTool(registration);
        
        if (this.debug) {
            console.debug(`AgentFlowClient: Registered tool '${registration.name}' for node '${registration.node}'`);
        }
    }

    /**
     * Setup tools on the server (dummy implementation for now)
     * In the future, this will send tool definitions to the server
     */
    async setup(): Promise<void> {
        if (this.debug) {
            console.debug('AgentFlowClient: Setting up tools on server (dummy implementation)');
            console.debug(`AgentFlowClient: ${this.toolRegistrations.length} tools registered`);
        }
        
        // TODO: Implement actual server setup when backend is ready
        // For now, this is a no-op
        return Promise.resolve();
    }

    async ping(): Promise<PingResponse> {
        const context: PingContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return ping(context);
    }

    async graph(): Promise<GraphResponse> {
        const context: GraphContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return graph(context);
    }

    async graphStateSchema(): Promise<StateSchemaResponse> {
        const context: StateSchemaContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return stateSchema(context);
    }

    /**
     * Fetch the state of a specific thread
     * @param threadId - The ID of the thread to fetch state for
     * @returns ThreadStateResponse containing the thread's current state
     */
    async threadState(threadId: number): Promise<ThreadStateResponse> {
        const context: ThreadStateContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return threadState(context, threadId);
    }

    /**
     * Update the state of a specific thread (checkpoint)
     * @param threadId - The ID of the thread to update
     * @param config - Configuration map for the thread
     * @param state - New AgentState for the thread
     * @returns UpdateThreadStateResponse with the updated state
     */
    async updateThreadState(
        threadId: number,
        config: Record<string, any>,
        state: any // AgentState
    ): Promise<UpdateThreadStateResponse> {
        const context: UpdateThreadStateContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: UpdateThreadStateRequest = {
            config,
            state
        };

        return updateThreadState(context, threadId, request);
    }

    /**
     * Invoke the agent graph with automatic tool execution loop
     * @param messages - Array of messages to send
     * @param options - Invoke options
     * @returns InvokeResult with all messages and intermediate steps
     */
    async invoke(
        messages: Message[],
        options?: {
            initial_state?: Record<string, any>;
            config?: Record<string, any>;
            recursion_limit?: number;
            response_granularity?: 'full' | 'partial' | 'low';
            onPartialResult?: InvokeCallback;
        }
    ): Promise<InvokeResult> {
        const context: InvokeContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug,
            toolExecutor: this.toolExecutor
        };

        // Prepare request
        const request: InvokeRequest = {
            messages: messages.map(msg => this.serializeMessage(msg)),
            initial_state: options?.initial_state,
            config: options?.config,
            recursion_limit: options?.recursion_limit || 25,
            response_granularity: options?.response_granularity || 'full'
        };

        // Call the invoke endpoint (which handles the recursion loop)
        return invokeEndpoint(context, request, options?.onPartialResult);
    }

    /**
     * Stream invoke to the agent graph
     * Returns an async iterable that yields stream chunks as they arrive
     * 
     * @param messages - Array of messages to send
     * @param options - Stream options
     * @returns AsyncGenerator of StreamChunk objects
     * 
     * @example
     * ```ts
     * const stream = client.streamInvoke([userMessage], { 
     *   initial_state: {}, 
     *   response_granularity: 'low' 
     * });
     * 
     * for await (const chunk of stream) {
     *   if (chunk.event === 'message') {
     *     console.log('Message:', chunk.message?.content);
     *   } else if (chunk.event === 'updates') {
     *     console.log('State updated:', chunk.state);
     *   }
     * }
     * ```
     */
    stream(
        messages: Message[],
        options?: {
            initial_state?: Record<string, any>;
            config?: Record<string, any>;
            recursion_limit?: number;
            response_granularity?: 'full' | 'partial' | 'low';
        }
    ): AsyncGenerator<StreamChunk, void, unknown> {
        const context: StreamContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug,
            toolExecutor: this.toolExecutor
        };

        // Prepare request
        const request: StreamRequest = {
            messages: messages.map(msg => this.serializeMessage(msg)),
            initial_state: options?.initial_state,
            config: options?.config,
            recursion_limit: options?.recursion_limit || 25,
            response_granularity: options?.response_granularity || 'low'
        };

        // Return async generator from the stream endpoint
        return streamInvokeEndpoint(context, request);
    }

    /**
     * Serialize a Message object for API transmission
     * Converts Message class instances to plain objects
     */
    private serializeMessage(message: Message): any {
        const serialized: any = {
            role: message.role,
            content: this.cleanContent(message.content)
        };

        // message_id: use 0 if not set (server will generate one)
        if (message.message_id !== null && message.message_id !== undefined) {
            serialized.message_id = message.message_id;
        } else {
            serialized.message_id = 0;
        }

        // Only include optional fields if they are explicitly set
        if (message.tools_calls) {
            serialized.tools_calls = message.tools_calls;
        }
        if (message.metadata && Object.keys(message.metadata).length > 0) {
            serialized.metadata = message.metadata;
        }

        return serialized;
    }

    /**
     * Clean content blocks by removing empty arrays and undefined values
     * Also simplify to string format if it's a simple text message
     */
    private cleanContent(content: any[]): any {
        // If it's a single text block, send as string
        if (content.length === 1 && content[0].type === 'text') {
            return content[0].text;
        }
        
        // Otherwise send as array of blocks
        return content.map(block => {
            const cleaned: any = {};
            
            for (const [key, value] of Object.entries(block)) {
                // Skip empty arrays
                if (Array.isArray(value) && value.length === 0) {
                    continue;
                }
                // Skip undefined values
                if (value === undefined) {
                    continue;
                }
                cleaned[key] = value;
            }
            
            return cleaned;
        });
    }
}