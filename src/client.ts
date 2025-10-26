import { ToolDefinition, ToolRegistration, ToolExecutor } from './tools.js';
import { Message } from './message.js';
import { ping, PingContext, PingResponse } from './endpoints/ping.js';
import { graph, GraphContext, GraphResponse } from './endpoints/graph.js';
import { stateSchema, StateSchemaContext, StateSchemaResponse } from './endpoints/stateSchema.js';
import { threadState, ThreadStateContext, ThreadStateResponse } from './endpoints/threadState.js';
import { updateThreadState, UpdateThreadStateContext, UpdateThreadStateRequest, UpdateThreadStateResponse } from './endpoints/updateThreadState.js';
import { clearThreadState, ClearThreadStateContext, ClearThreadStateResponse } from './endpoints/clearThreadState.js';
import { threadMessages, ThreadMessagesContext, ThreadMessagesRequest, ThreadMessagesResponse } from './endpoints/threadMessages.js';
import { addThreadMessages, AddThreadMessagesContext, AddThreadMessagesRequest, AddThreadMessagesResponse } from './endpoints/addThreadMessages.js';
import { threadMessage, ThreadMessageContext, ThreadMessageRequest, ThreadMessageResponse } from './endpoints/threadMessage.js';
import { threadDetails, ThreadDetailsContext, ThreadDetailsResponse } from './endpoints/threadDetails.js';
import { deleteThreadMessage, DeleteThreadMessageContext, DeleteThreadMessageRequest, DeleteThreadMessageResponse } from './endpoints/deleteThreadMessage.js';
import { deleteThread, DeleteThreadContext, DeleteThreadRequest, DeleteThreadResponse } from './endpoints/deleteThread.js';
import { threads, ThreadsContext, ThreadsRequest, ThreadsResponse } from './endpoints/threads.js';
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
import {
    storeMemory as storeMemoryEndpoint,
    StoreMemoryContext,
    StoreMemoryRequest,
    StoreMemoryResponse
} from './endpoints/storeMemory.js';
import {
    searchMemory as searchMemoryEndpoint,
    SearchMemoryContext,
    SearchMemoryRequest,
    SearchMemoryResponse
} from './endpoints/searchMemory.js';
import {
    getMemory as getMemoryEndpoint,
    GetMemoryContext,
    GetMemoryRequest,
    GetMemoryResponse
} from './endpoints/getMemory.js';
import {
    updateMemory as updateMemoryEndpoint,
    UpdateMemoryContext,
    UpdateMemoryRequest,
    UpdateMemoryResponse
} from './endpoints/updateMemory.js';

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

    
    /**
     * Ping the server to check connectivity
     */
    async ping(): Promise<PingResponse> {
        const context: PingContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return ping(context);
    }

    /**
     * Fetch the agent graph 
     */
    async graph(): Promise<GraphResponse> {
        const context: GraphContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return graph(context);
    }

    /**
     * Fetch the state schema of the agent
     */
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
     * ***************** ALL THREAD APIS *****************
     */

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
     * Clear the state of a specific thread (delete checkpoint)
     * @param threadId - The ID of the thread to clear state for
     * @returns ClearThreadStateResponse with the clear operation result
     */
    async clearThreadState(threadId: number): Promise<ClearThreadStateResponse> {
        const context: ClearThreadStateContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return clearThreadState(context, threadId);
    }

    /**
     * Fetch details for a specific thread
     * @param threadId - The ID of the thread to fetch
     * @returns ThreadDetailsResponse containing thread details
     */
    async threadDetails(threadId: string | number): Promise<ThreadDetailsResponse> {
        const context: ThreadDetailsContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return threadDetails(context, threadId);
    }

    /**
     * Fetch list of threads with optional search and pagination
     * @param search - Optional search term to filter threads
     * @param offset - Optional offset for pagination (default 0)
     * @param limit - Optional limit for pagination (default no limit)
     * @returns ThreadsResponse containing the list of threads and metadata
     */
    async threads(
        search?: string,
        offset?: number,
        limit?: number
    ): Promise<ThreadsResponse> {
        const context: ThreadsContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: ThreadsRequest = {
            search,
            offset,
            limit
        };

        return threads(context, request);
    }

    /**
     * Fetch messages from a specific thread with optional search and pagination
     * @param threadId - The ID of the thread to fetch messages from
     * @param search - Optional search term to filter messages
     * @param offset - Optional offset for pagination (default 0)
     * @param limit - Optional limit for pagination (default no limit)
     * @returns ThreadMessagesResponse containing the messages and metadata
     */
    async threadMessages(
        threadId: string | number,
        search?: string,
        offset?: number,
        limit?: number
    ): Promise<ThreadMessagesResponse> {
        const context: ThreadMessagesContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: ThreadMessagesRequest = {
            threadId,
            search,
            offset,
            limit
        };

        return threadMessages(context, request);
    }

    /**
     * Add messages to a specific thread checkpoint
     * @param threadId - The ID of the thread to add messages to
     * @param messages - Array of messages to add to the checkpoint
     * @param config - Configuration map for the checkpoint
     * @param metadata - Optional metadata for the checkpoint
     * @returns AddCheckpointMessagesResponse containing the operation result
     */
    async addThreadMessages(
        threadId: string | number,
        messages: Message[],
        config: Record<string, any> = {},
        metadata?: Record<string, any>
    ): Promise<AddThreadMessagesResponse> {
        const context: AddThreadMessagesContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: AddThreadMessagesRequest = {
            threadId,
            config,
            messages,
            metadata
        };

        return addThreadMessages(context, request);
    }

    /**
     * Fetch a specific message from a thread by message ID
     * @param threadId - The ID of the thread
     * @param messageId - The ID of the message to fetch
     * @returns ThreadMessageResponse containing the message and metadata
     */
    async singleMessage(
        threadId: string | number,
        messageId: string
    ): Promise<ThreadMessageResponse> {
        const context: ThreadMessageContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: ThreadMessageRequest = {
            threadId,
            messageId
        };

        return threadMessage(context, request);
    }

    /**
     * Delete a specific message from a thread
     * @param threadId - The ID of the thread
     * @param messageId - The ID of the message to delete
     * @param config - Optional configuration map to send with the request body
     * @returns DeleteThreadMessageResponse containing the deletion result
     */
    async deleteMessage(
        threadId: string | number,
        messageId: string,
        config?: Record<string, any>
    ): Promise<DeleteThreadMessageResponse> {
        const context: DeleteThreadMessageContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: DeleteThreadMessageRequest = {
            threadId,
            messageId,
            config
        };

        return deleteThreadMessage(context, request);
    }

    /**
     * Delete a specific thread
     * @param threadId - The ID of the thread to delete
     * @param config - Optional configuration map to send with the request body
     * @returns DeleteThreadResponse containing the deletion result
     */
    async deleteThread(
        threadId: string | number,
        config?: Record<string, any>
    ): Promise<DeleteThreadResponse> {
        const context: DeleteThreadContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: DeleteThreadRequest = {
            threadId,
            config
        };

        return deleteThread(context, request);
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
     * Store a memory in the agent's memory system
     * 
     * @param request - Memory storage request parameters
     * @returns Promise<StoreMemoryResponse> containing the memory_id
     * 
     * @example
     * ```ts
     * const result = await client.storeMemory({
     *   content: "User prefers dark mode",
     *   memory_type: MemoryType.SEMANTIC,
     *   category: "preferences",
     *   metadata: { source: "user_settings" }
     * });
     * console.log('Memory stored with ID:', result.data.memory_id);
     * ```
     */
    async storeMemory(request: StoreMemoryRequest): Promise<StoreMemoryResponse> {
        const context: StoreMemoryContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return storeMemoryEndpoint(context, request);
    }

    /**
     * Search for memories in the agent's memory system
     * 
     * @param request - Memory search request parameters
     * @returns Promise<SearchMemoryResponse> containing matching memories
     * 
     * @example
     * ```ts
     * const results = await client.searchMemory({
     *   query: "dark mode preferences",
     *   memory_type: MemoryType.SEMANTIC,
     *   limit: 5,
     *   retrieval_strategy: RetrievalStrategy.SIMILARITY
     * });
     * results.data.results.forEach(result => {
     *   console.log('Memory:', result.content, 'Score:', result.score);
     * });
     * ```
     */
    async searchMemory(request: SearchMemoryRequest): Promise<SearchMemoryResponse> {
        const context: SearchMemoryContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        return searchMemoryEndpoint(context, request);
    }

    /**
     * Get a specific memory by ID
     * 
     * @param memoryId - The ID of the memory to retrieve
     * @param options - Optional config and options
     * @returns Promise<GetMemoryResponse> containing the memory details
     * 
     * @example
     * ```ts
     * const memory = await client.getMemory('mem-12345', {
     *   config: { include_vector: true }
     * });
     * console.log('Memory:', memory.data.memory.content);
     * console.log('Score:', memory.data.memory.score);
     * ```
     */
    async getMemory(
        memoryId: string,
        options?: { config?: Record<string, any>; options?: Record<string, any> }
    ): Promise<GetMemoryResponse> {
        const context: GetMemoryContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: GetMemoryRequest = {
            memoryId,
            config: options?.config,
            options: options?.options
        };

        return getMemoryEndpoint(context, request);
    }

    /**
     * Update an existing memory by ID
     * 
     * @param memoryId - The ID of the memory to update
     * @param content - The updated content for the memory
     * @param options - Optional config, options, and metadata
     * @returns Promise<UpdateMemoryResponse> containing success status and updated data
     * 
     * @example
     * ```ts
     * const result = await client.updateMemory('mem-12345', 'Updated content', {
     *   metadata: { tags: ['important', 'updated'] }
     * });
     * console.log('Update success:', result.data.success);
     * ```
     */
    async updateMemory(
        memoryId: string,
        content: string,
        options?: { config?: Record<string, any>; options?: Record<string, any>; metadata?: Record<string, any> }
    ): Promise<UpdateMemoryResponse> {
        const context: UpdateMemoryContext = {
            baseUrl: this.baseUrl,
            authToken: this.authToken,
            timeout: this.timeout,
            debug: this.debug
        };

        const request: UpdateMemoryRequest = {
            memoryId,
            content,
            config: options?.config,
            options: options?.options,
            metadata: options?.metadata
        };

        return updateMemoryEndpoint(context, request);
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