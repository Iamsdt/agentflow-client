# AgentFlow API Reference

Complete API reference for all endpoints in the agentflow-react library.

## Table of Contents

- [Client Configuration](#client-configuration)
- [Health & Metadata](#health--metadata)
  - [ping()](#ping)
  - [graph()](#graph)
  - [stateSchema()](#stateschema)
- [Thread Management](#thread-management)
  - [threads()](#threads)
  - [threadDetails()](#threaddetails)
  - [threadState()](#threadstate)
  - [updateThreadState()](#updatethreadstate)
  - [clearThreadState()](#clearthreadstate)
  - [deleteThread()](#deletethread)
- [Message Management](#message-management)
  - [threadMessages()](#threadmessages)
  - [threadMessage()](#threadmessage)
  - [addThreadMessages()](#addthreadmessages)
  - [deleteThreadMessage()](#deletethreadmessage)
- [Execution](#execution)
  - [invoke()](#invoke)
  - [stream()](#stream)
- [Memory Management](#memory-management)
  - [storeMemory()](#storememory)
  - [searchMemory()](#searchmemory)
  - [getMemory()](#getmemory)
  - [updateMemory()](#updatememory)
  - [deleteMemory()](#deletememory)
  - [listMemories()](#listmemories)
  - [forgetMemories()](#forgetmemories)

---

## Client Configuration

### AgentFlowClient

Initialize the AgentFlow client with configuration.

```typescript
import { AgentFlowClient } from 'agentflow-react';

const client = new AgentFlowClient({
  baseUrl: string,      // Required: API base URL
  authToken?: string,   // Optional: Authentication token
  timeout?: number,     // Optional: Request timeout in ms (default: 300000 = 5min)
  debug?: boolean       // Optional: Enable debug logging (default: false)
});
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| baseUrl | string | Yes | - | Base URL of the AgentFlow API |
| authToken | string | No | null | Bearer token for authentication |
| timeout | number | No | 300000 | Request timeout in milliseconds |
| debug | boolean | No | false | Enable debug logging to console |

**Example:**

```typescript
const client = new AgentFlowClient({
  baseUrl: 'https://api.agentflow.example.com',
  authToken: 'your-secret-token',
  timeout: 60000,  // 1 minute
  debug: true
});
```

---

## Health & Metadata

### ping()

Health check endpoint to verify API connectivity.

**Endpoint:** `GET /v1/ping`

**Signature:**
```typescript
ping(): Promise<PingResponse>
```

**Returns:**
```typescript
interface PingResponse {
  data: string;  // "pong"
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.ping();
console.log(response.data);  // "pong"
console.log(response.metadata.request_id);
```

**Throws:**
- `AuthenticationError` (401) - Invalid or missing auth token
- `ServerError` (500+) - Server issues

---

### graph()

Get the graph structure and metadata for the agent workflow.

**Endpoint:** `GET /v1/graph`

**Signature:**
```typescript
graph(): Promise<GraphResponse>
```

**Returns:**
```typescript
interface GraphResponse {
  data: {
    graph: any;  // Graph structure definition
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.graph();
console.log(response.data.graph);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Graph not found
- `ServerError` (500+) - Server issues

---

### stateSchema()

Retrieve the state schema definition with field types and descriptions.

**Endpoint:** `GET /v1/graph/state/schema`

**Signature:**
```typescript
stateSchema(): Promise<StateSchemaResponse>
```

**Returns:**
```typescript
interface StateSchemaResponse {
  data: {
    fields: {
      [fieldName: string]: FieldSchema;
    };
  };
  metadata: ResponseMetadata;
}

interface FieldSchema {
  type: string;           // Field type: "string", "number", "boolean", etc.
  description?: string;   // Human-readable description
  default?: any;          // Default value
  required?: boolean;     // Whether field is required
}
```

**Example:**
```typescript
const response = await client.stateSchema();
const fields = response.data.fields;

// Display all fields
for (const [name, schema] of Object.entries(fields)) {
  console.log(`${name}: ${schema.type} - ${schema.description}`);
}
```

**Use Cases:**
- Build dynamic forms
- Validate state data
- Generate documentation
- Create TypeScript types

**See Also:**
- [State Schema Guide](./state-schema-guide.md)
- [State Schema Examples](../examples/state-schema-examples.ts)

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `ServerError` (500+) - Server issues

---

## Thread Management

### threads()

List all threads with optional search and pagination.

**Endpoint:** `GET /v1/threads`

**Signature:**
```typescript
threads(options?: ThreadsRequest): Promise<ThreadsResponse>
```

**Parameters:**
```typescript
interface ThreadsRequest {
  search?: string;   // Search query to filter threads
  offset?: number;   // Pagination offset (default: 0)
  limit?: number;    // Number of results (default: 20)
}
```

**Returns:**
```typescript
interface ThreadsResponse {
  data: {
    threads: ThreadItem[];
  };
  metadata: ResponseMetadata;
}

interface ThreadItem {
  thread_id: string;
  thread_name: string | null;
  user_id: string | null;
  metadata: Record<string, any> | null;
  updated_at: string | null;
  run_id: string | null;
}
```

**Example:**
```typescript
// Get all threads
const response = await client.threads();

// Search and paginate
const filtered = await client.threads({
  search: 'customer support',
  offset: 0,
  limit: 10
});

for (const thread of filtered.data.threads) {
  console.log(`${thread.thread_id}: ${thread.thread_name}`);
}
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Invalid pagination parameters
- `ServerError` (500+) - Server issues

---

### threadDetails()

Get detailed information about a specific thread.

**Endpoint:** `GET /v1/threads/{thread_id}`

**Signature:**
```typescript
threadDetails(threadId: string): Promise<ThreadDetailsResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string | Yes | Unique thread identifier |

**Returns:**
```typescript
interface ThreadDetailsResponse {
  data: {
    thread_id: string;
    thread_name: string | null;
    user_id: string | null;
    metadata: Record<string, any> | null;
    created_at: string | null;
    updated_at: string | null;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const details = await client.threadDetails('thread_123');
console.log(details.data.thread_name);
console.log(details.data.created_at);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

### threadState()

Get the current state of a thread.

**Endpoint:** `GET /v1/threads/{thread_id}/state`

**Signature:**
```typescript
threadState(threadId: string): Promise<ThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string | Yes | Unique thread identifier |

**Returns:**
```typescript
interface ThreadStateResponse {
  data: {
    state: Record<string, any>;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const state = await client.threadState('thread_123');
console.log(state.data.state);

// Access specific state fields
const userPreferences = state.data.state.preferences;
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

### updateThreadState()

Update the state of a thread.

**Endpoint:** `POST /v1/threads/{thread_id}/state`

**Signature:**
```typescript
updateThreadState(
  threadId: string,
  request: UpdateThreadStateRequest
): Promise<UpdateThreadStateResponse>
```

**Parameters:**
```typescript
interface UpdateThreadStateRequest {
  config?: Record<string, any>;  // Optional configuration
  state: Record<string, any>;    // State values to update
}
```

**Returns:**
```typescript
interface UpdateThreadStateResponse {
  data: {
    state: Record<string, any>;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.updateThreadState('thread_123', {
  state: {
    step: 'completed',
    progress: 100,
    result: { success: true }
  },
  config: {
    validate: true
  }
});

console.log(response.data.state);
```

**Throws:**
- `BadRequestError` (400) - Invalid state data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ValidationError` (422) - State validation failed
- `ServerError` (500+) - Server issues

---

### clearThreadState()

Clear all state data from a thread.

**Endpoint:** `DELETE /v1/threads/{thread_id}/state`

**Signature:**
```typescript
clearThreadState(threadId: string): Promise<ClearThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string | Yes | Unique thread identifier |

**Returns:**
```typescript
interface ClearThreadStateResponse {
  data: {
    success: boolean;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.clearThreadState('thread_123');
console.log(response.data.success);  // true
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

### deleteThread()

Permanently delete a thread and all its associated data.

**Endpoint:** `DELETE /v1/threads/{thread_id}`

**Signature:**
```typescript
deleteThread(
  threadId: string,
  request?: DeleteThreadRequest
): Promise<DeleteThreadResponse>
```

**Parameters:**
```typescript
interface DeleteThreadRequest {
  config?: Record<string, any>;
}
```

**Returns:**
```typescript
interface DeleteThreadResponse {
  data: {
    success: boolean;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.deleteThread('thread_123');
console.log(response.data.success);  // true
```

**Warning:** This operation is permanent and cannot be undone.

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete thread
- `NotFoundError` (404) - Thread not found
- `ServerError` (500+) - Server issues

---

## Message Management

### threadMessages()

Get all messages from a thread with pagination.

**Endpoint:** `GET /v1/threads/{thread_id}/messages`

**Signature:**
```typescript
threadMessages(
  threadId: string,
  options?: ThreadMessagesRequest
): Promise<ThreadMessagesResponse>
```

**Parameters:**
```typescript
interface ThreadMessagesRequest {
  offset?: number;  // Pagination offset (default: 0)
  limit?: number;   // Number of results (default: 20)
}
```

**Returns:**
```typescript
interface ThreadMessagesResponse {
  data: {
    messages: Message[];
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
// Get all messages
const response = await client.threadMessages('thread_123');

// Paginate
const recent = await client.threadMessages('thread_123', {
  offset: 0,
  limit: 10
});

for (const message of recent.data.messages) {
  console.log(message.role, message.content);
}
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ValidationError` (422) - Invalid pagination parameters
- `ServerError` (500+) - Server issues

---

### threadMessage()

Get a specific message from a thread by ID.

**Endpoint:** `GET /v1/threads/{thread_id}/messages/{message_id}`

**Signature:**
```typescript
threadMessage(
  threadId: string,
  messageId: string
): Promise<ThreadMessageResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string | Yes | Unique thread identifier |
| messageId | string | Yes | Unique message identifier |

**Returns:**
```typescript
interface ThreadMessageResponse {
  data: {
    message: Message;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.threadMessage('thread_123', 'msg_456');
const message = response.data.message;
console.log(message.role, message.content);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread or message not found
- `ServerError` (500+) - Server issues

---

### addThreadMessages()

Add new messages to a thread.

**Endpoint:** `POST /v1/threads/{thread_id}/messages`

**Signature:**
```typescript
addThreadMessages(
  threadId: string,
  request: AddThreadMessagesRequest
): Promise<AddThreadMessagesResponse>
```

**Parameters:**
```typescript
interface AddThreadMessagesRequest {
  config?: Record<string, any>;
  messages: Message[];  // Array of messages to add
}
```

**Returns:**
```typescript
interface AddThreadMessagesResponse {
  data: {
    messages: Message[];
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { Message } from 'agentflow-react';

const response = await client.addThreadMessages('thread_123', {
  messages: [
    Message.user('Hello, I need help'),
    Message.assistant('How can I assist you today?')
  ]
});

console.log(`Added ${response.data.messages.length} messages`);
```

**Throws:**
- `BadRequestError` (400) - Invalid message format
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Thread not found
- `ValidationError` (422) - Message validation failed
- `ServerError` (500+) - Server issues

---

### deleteThreadMessage()

Delete a specific message from a thread.

**Endpoint:** `DELETE /v1/threads/{thread_id}/messages/{message_id}`

**Signature:**
```typescript
deleteThreadMessage(
  threadId: string,
  messageId: string
): Promise<DeleteThreadMessageResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string | Yes | Unique thread identifier |
| messageId | string | Yes | Unique message identifier |

**Returns:**
```typescript
interface DeleteThreadMessageResponse {
  data: {
    success: boolean;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.deleteThreadMessage('thread_123', 'msg_456');
console.log(response.data.success);  // true
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete message
- `NotFoundError` (404) - Thread or message not found
- `ServerError` (500+) - Server issues

---

## Execution

### invoke()

Execute the agent workflow synchronously with automatic tool execution loop.

**Endpoint:** `POST /v1/graph/invoke`

**Signature:**
```typescript
invoke(request: InvokeRequest): Promise<InvokeResult>
```

**Parameters:**
```typescript
interface InvokeRequest {
  messages: Message[];                    // Input messages
  config?: Record<string, any>;           // Optional configuration
  stream?: boolean;                       // Always false for invoke
  granularity?: 'low' | 'partial' | 'full';  // Response detail level
  recursion_limit?: number;               // Max tool execution iterations (default: 25)
  on_progress?: InvokeCallback;           // Progress callback
}

type InvokeCallback = (result: InvokePartialResult) => void;
```

**Returns:**
```typescript
interface InvokeResult {
  messages: Message[];              // Final response messages
  all_messages: Message[];          // All messages including tool calls
  state?: Record<string, any>;      // Final state (if granularity >= 'partial')
  context?: any;                    // Context data (if granularity >= 'partial')
  summary?: string;                 // Summary (if granularity == 'full')
  iterations: number;               // Number of iterations performed
  recursion_limit_reached: boolean; // Whether limit was hit
  metadata: ResponseMetadata;       // Response metadata
}
```

**Tool Execution Loop:**

The invoke endpoint automatically:
1. Sends messages to the API
2. Checks response for `remote_tool_call` blocks
3. Executes tools locally using registered handlers
4. Sends tool results back to API
5. Repeats until no more tool calls or recursion limit reached

**Example:**
```typescript
import { Message } from 'agentflow-react';

// Register tools first
client.registerTool({
  node: 'weather_node',
  name: 'get_weather',
  description: 'Get weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    },
    required: ['location']
  },
  handler: async (args) => {
    return { temp: 72, condition: 'sunny' };
  }
});

// Invoke with automatic tool execution
const result = await client.invoke({
  messages: [
    Message.user("What's the weather in San Francisco?")
  ],
  granularity: 'full',
  recursion_limit: 10,
  on_progress: (partial) => {
    console.log(`Iteration ${partial.iterations}`);
  }
});

console.log(result.messages);        // Final response
console.log(result.all_messages);    // All messages including tool calls
console.log(result.iterations);      // Number of iterations
```

**Granularity Levels:**

| Level | Returns |
|-------|---------|
| `low` | messages, metadata only |
| `partial` | + state, context |
| `full` | + summary |

**See Also:**
- [Invoke Usage Guide](./invoke-usage.md)
- [Invoke Example](../examples/invoke-example.ts)

**Throws:**
- `BadRequestError` (400) - Invalid request data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Graph not found
- `ValidationError` (422) - Message validation failed
- `ServerError` (500+) - Server issues

---

### stream()

Execute the agent workflow with streaming responses.

**Endpoint:** `POST /v1/graph/stream` (SSE)

**Signature:**
```typescript
stream(request: StreamRequest): AsyncIterableIterator<StreamChunk>
```

**Parameters:**
```typescript
interface StreamRequest {
  messages: Message[];                    // Input messages
  config?: Record<string, any>;           // Optional configuration
  stream?: boolean;                       // Always true for stream
  granularity?: 'low' | 'partial' | 'full';  // Response detail level
}
```

**Returns:** AsyncIterableIterator yielding:
```typescript
interface StreamChunk {
  event: StreamEventType;
  data: any;
}

type StreamEventType = 
  | 'metadata'           // Response metadata
  | 'on_chain_start'     // Chain execution started
  | 'on_chain_stream'    // Chain streaming data
  | 'on_chain_end'       // Chain execution ended
  | 'messages_chunk'     // Message chunk received
  | 'state_chunk'        // State update chunk
  | 'context_chunk'      // Context update chunk
  | 'summary_chunk'      // Summary chunk (full granularity only)
  | 'error';             // Error occurred
```

**Example:**
```typescript
import { Message } from 'agentflow-react';

try {
  for await (const chunk of client.stream({
    messages: [
      Message.user("Tell me a story")
    ],
    granularity: 'full'
  })) {
    switch (chunk.event) {
      case 'metadata':
        console.log('Request ID:', chunk.data.request_id);
        break;
      
      case 'on_chain_start':
        console.log('Chain started');
        break;
      
      case 'messages_chunk':
        // Incremental message content
        process.stdout.write(chunk.data);
        break;
      
      case 'state_chunk':
        // State updates
        console.log('State:', chunk.data);
        break;
      
      case 'on_chain_end':
        console.log('Chain completed');
        break;
      
      case 'error':
        console.error('Error:', chunk.data);
        break;
    }
  }
} catch (error) {
  console.error('Stream failed:', error);
}
```

**Progressive Content:**

Stream provides progressive updates as the agent processes:
- Real-time message generation
- State updates during execution
- Context changes
- Summary generation (full granularity)

**See Also:**
- [Stream Usage Guide](./stream-usage.md)
- [Stream Example](../examples/stream-example.ts)
- [Stream Quick Reference](./stream-quick-ref.md)

**Throws:**
- `BadRequestError` (400) - Invalid request data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Graph not found
- `ValidationError` (422) - Message validation failed
- `ServerError` (500+) - Server issues

---

## Memory Management

### storeMemory()

Store a new memory in the agent's memory system.

**Endpoint:** `POST /v1/store/memories`

**Signature:**
```typescript
storeMemory(request: StoreMemoryRequest): Promise<StoreMemoryResponse>
```

**Parameters:**
```typescript
interface StoreMemoryRequest {
  config?: Record<string, any>;      // Optional configuration
  options?: Record<string, any>;     // Optional storage options
  content: string;                   // Memory content
  memory_type: MemoryType;           // Type of memory
  category: string;                  // Memory category
  metadata?: Record<string, any>;    // Additional metadata
}

enum MemoryType {
  EPISODIC = "episodic",          // Conversation memories
  SEMANTIC = "semantic",           // Facts and knowledge
  PROCEDURAL = "procedural",       // How-to knowledge
  ENTITY = "entity",               // Entity-based memories
  RELATIONSHIP = "relationship",   // Entity relationships
  CUSTOM = "custom",               // Custom memory types
  DECLARATIVE = "declarative"      // Explicit facts and events
}
```

**Returns:**
```typescript
interface StoreMemoryResponse {
  data: {
    memory_id: string;  // Unique ID of stored memory
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { MemoryType } from 'agentflow-react';

const response = await client.storeMemory({
  content: 'User prefers dark mode',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  metadata: {
    user_id: 'user_123',
    timestamp: new Date().toISOString()
  }
});

console.log('Stored memory:', response.data.memory_id);
```

**Memory Types:**

| Type | Use Case |
|------|----------|
| `EPISODIC` | Conversation history, events |
| `SEMANTIC` | Facts, knowledge, preferences |
| `PROCEDURAL` | How-to information, procedures |
| `ENTITY` | Information about entities |
| `RELATIONSHIP` | Relationships between entities |
| `DECLARATIVE` | Explicit facts and events |
| `CUSTOM` | Custom memory types |

**Throws:**
- `BadRequestError` (400) - Invalid memory data
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Memory validation failed
- `ServerError` (500+) - Server issues

---

### searchMemory()

Search for memories using vector similarity or other retrieval strategies.

**Endpoint:** `POST /v1/store/search`

**Signature:**
```typescript
searchMemory(request: SearchMemoryRequest): Promise<SearchMemoryResponse>
```

**Parameters:**
```typescript
interface SearchMemoryRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  query: string;                              // Search query
  memory_type?: MemoryType;                   // Filter by memory type
  category?: string;                          // Filter by category
  limit?: number;                             // Max results (default: 10)
  score_threshold?: number;                   // Min similarity score (default: 0)
  filters?: Record<string, any>;              // Additional filters
  retrieval_strategy?: RetrievalStrategy;     // Search strategy
  distance_metric?: DistanceMetric;           // Similarity metric
  max_tokens?: number;                        // Max tokens to return (default: 4000)
}

enum RetrievalStrategy {
  SIMILARITY = "similarity",           // Vector similarity search
  TEMPORAL = "temporal",               // Time-based retrieval
  RELEVANCE = "relevance",             // Relevance scoring
  HYBRID = "hybrid",                   // Combined approaches
  GRAPH_TRAVERSAL = "graph_traversal"  // Knowledge graph navigation
}

enum DistanceMetric {
  COSINE = "cosine",
  EUCLIDEAN = "euclidean",
  DOT_PRODUCT = "dot_product",
  MANHATTAN = "manhattan"
}
```

**Returns:**
```typescript
interface SearchMemoryResponse {
  data: {
    results: MemoryResult[];
  };
  metadata: ResponseMetadata;
}

interface MemoryResult {
  id: string;
  content: string;
  score: number;                      // Similarity score (0-1)
  memory_type: string;
  metadata: Record<string, any>;
  vector: number[];                   // Embedding vector
  user_id: string;
  thread_id: string;
  timestamp: string;
}
```

**Example:**
```typescript
import { MemoryType, RetrievalStrategy, DistanceMetric } from 'agentflow-react';

const response = await client.searchMemory({
  query: 'user interface preferences',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  limit: 5,
  score_threshold: 0.7,
  retrieval_strategy: RetrievalStrategy.SIMILARITY,
  distance_metric: DistanceMetric.COSINE
});

for (const result of response.data.results) {
  console.log(`[${result.score.toFixed(2)}] ${result.content}`);
}
```

**Retrieval Strategies:**

| Strategy | Description |
|----------|-------------|
| `SIMILARITY` | Vector similarity search (default) |
| `TEMPORAL` | Time-based retrieval (recent first) |
| `RELEVANCE` | Relevance scoring |
| `HYBRID` | Combines multiple approaches |
| `GRAPH_TRAVERSAL` | Navigate knowledge graph |

**Distance Metrics:**

| Metric | Description |
|--------|-------------|
| `COSINE` | Cosine similarity (default) |
| `EUCLIDEAN` | Euclidean distance |
| `DOT_PRODUCT` | Dot product |
| `MANHATTAN` | Manhattan distance |

**Throws:**
- `BadRequestError` (400) - Invalid search parameters
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Validation failed
- `ServerError` (500+) - Server issues

---

### getMemory()

Retrieve a specific memory by ID.

**Endpoint:** `GET /v1/store/memories/{memory_id}`

**Signature:**
```typescript
getMemory(memoryId: string): Promise<GetMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |

**Returns:**
```typescript
interface GetMemoryResponse {
  data: {
    memory: MemoryResult;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.getMemory('mem_123');
const memory = response.data.memory;

console.log(memory.content);
console.log(memory.memory_type);
console.log(memory.metadata);
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Memory not found
- `ServerError` (500+) - Server issues

---

### updateMemory()

Update an existing memory's content or metadata.

**Endpoint:** `PUT /v1/store/memories/{memory_id}`

**Signature:**
```typescript
updateMemory(
  memoryId: string,
  request: UpdateMemoryRequest
): Promise<UpdateMemoryResponse>
```

**Parameters:**
```typescript
interface UpdateMemoryRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  content?: string;                    // Updated content
  memory_type?: MemoryType;            // Updated type
  category?: string;                   // Updated category
  metadata?: Record<string, any>;      // Updated metadata
}
```

**Returns:**
```typescript
interface UpdateMemoryResponse {
  data: {
    memory: MemoryResult;  // Updated memory
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.updateMemory('mem_123', {
  content: 'Updated user preference: prefers light mode',
  metadata: {
    updated_at: new Date().toISOString(),
    confidence: 0.95
  }
});

console.log('Updated:', response.data.memory.content);
```

**Throws:**
- `BadRequestError` (400) - Invalid update data
- `AuthenticationError` (401) - Invalid authentication
- `NotFoundError` (404) - Memory not found
- `ValidationError` (422) - Validation failed
- `ServerError` (500+) - Server issues

---

### deleteMemory()

Delete a specific memory by ID.

**Endpoint:** `DELETE /v1/store/memories/{memory_id}`

**Signature:**
```typescript
deleteMemory(memoryId: string): Promise<DeleteMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |

**Returns:**
```typescript
interface DeleteMemoryResponse {
  data: {
    success: boolean;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.deleteMemory('mem_123');
console.log(response.data.success);  // true
```

**Warning:** This operation is permanent and cannot be undone.

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete
- `NotFoundError` (404) - Memory not found
- `ServerError` (500+) - Server issues

---

### listMemories()

List all memories with optional filtering and pagination.

**Endpoint:** `GET /v1/store/memories`

**Signature:**
```typescript
listMemories(request?: ListMemoriesRequest): Promise<ListMemoriesResponse>
```

**Parameters:**
```typescript
interface ListMemoriesRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  memory_type?: MemoryType;    // Filter by type
  category?: string;            // Filter by category
  offset?: number;              // Pagination offset (default: 0)
  limit?: number;               // Number of results (default: 20)
  filters?: Record<string, any>; // Additional filters
}
```

**Returns:**
```typescript
interface ListMemoriesResponse {
  data: {
    memories: MemoryResult[];
    total?: number;  // Total count (if available)
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { MemoryType } from 'agentflow-react';

// List all semantic memories
const response = await client.listMemories({
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  offset: 0,
  limit: 10
});

console.log(`Found ${response.data.memories.length} memories`);
for (const memory of response.data.memories) {
  console.log(`- ${memory.content}`);
}
```

**Throws:**
- `AuthenticationError` (401) - Invalid authentication
- `ValidationError` (422) - Invalid parameters
- `ServerError` (500+) - Server issues

---

### forgetMemories()

Delete multiple memories matching specified criteria.

**Endpoint:** `POST /v1/store/memories/forget`

**Signature:**
```typescript
forgetMemories(request: ForgetMemoriesRequest): Promise<ForgetMemoriesResponse>
```

**Parameters:**
```typescript
interface ForgetMemoriesRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  memory_ids?: string[];               // Specific memory IDs to delete
  memory_type?: MemoryType;            // Delete by type
  category?: string;                   // Delete by category
  filters?: Record<string, any>;       // Additional filters
  before_date?: string;                // Delete memories before date
  score_threshold?: number;            // Delete below similarity score
}
```

**Returns:**
```typescript
interface ForgetMemoriesResponse {
  data: {
    deleted_count: number;  // Number of memories deleted
    memory_ids: string[];   // IDs of deleted memories
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { MemoryType } from 'agentflow-react';

// Delete specific memories
const response1 = await client.forgetMemories({
  memory_ids: ['mem_123', 'mem_456']
});

// Delete by category and type
const response2 = await client.forgetMemories({
  memory_type: MemoryType.EPISODIC,
  category: 'old_conversations',
  before_date: '2024-01-01T00:00:00Z'
});

console.log(`Deleted ${response2.data.deleted_count} memories`);
```

**Warning:** This operation is permanent and cannot be undone.

**Throws:**
- `BadRequestError` (400) - Invalid criteria
- `AuthenticationError` (401) - Invalid authentication
- `PermissionError` (403) - No permission to delete
- `ValidationError` (422) - Validation failed
- `ServerError` (500+) - Server issues

---

## Error Handling

All endpoints may throw the following errors. See [Error Handling Guide](./error-handling.md) for details.

| Error Class | Status Code | Description |
|-------------|-------------|-------------|
| `BadRequestError` | 400 | Invalid request data |
| `AuthenticationError` | 401 | Authentication failed |
| `PermissionError` | 403 | Permission denied |
| `NotFoundError` | 404 | Resource not found |
| `ValidationError` | 422 | Validation failed |
| `ServerError` | 500+ | Server-side errors |

**See Also:**
- [Error Handling Guide](./error-handling.md)
- [Examples Directory](../examples/)

---

## Response Metadata

All responses include metadata with request tracking information:

```typescript
interface ResponseMetadata {
  message: string;        // Status message
  request_id: string;     // Unique request identifier (for debugging)
  timestamp: string;      // ISO 8601 timestamp
}
```

**Using Request IDs:**

Request IDs are useful for:
- Debugging issues
- Support tickets
- Log correlation
- Performance tracking

```typescript
try {
  const response = await client.invoke(request);
  console.log('Success! Request ID:', response.metadata.request_id);
} catch (error) {
  if (error instanceof AgentFlowError) {
    console.error('Failed! Request ID:', error.requestId);
    // Include this ID in support tickets
  }
}
```
