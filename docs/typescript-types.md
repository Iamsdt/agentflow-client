# TypeScript Types Guide

Complete TypeScript reference for agentflow-react.

## Table of Contents

- [Installation with TypeScript](#installation-with-typescript)
- [Core Interfaces](#core-interfaces)
- [Message Types](#message-types)
- [Request & Response Types](#request--response-types)
- [Tool Types](#tool-types)
- [Memory Types](#memory-types)
- [Stream Types](#stream-types)
- [Error Types](#error-types)
- [Type Guards](#type-guards)
- [Generic Types](#generic-types)
- [Custom Type Extensions](#custom-type-extensions)

---

## Installation with TypeScript

The library includes full TypeScript support with type definitions.

### Basic Setup

```bash
npm install agentflow-react
```

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

### Importing Types

```typescript
import {
  // Client
  AgentFlowClient,
  AgentFlowConfig,
  
  // Messages
  Message,
  TextBlock,
  ImageBlock,
  AudioBlock,
  RemoteToolCallBlock,
  ToolResultBlock,
  
  // Tools
  ToolRegistration,
  ToolHandler,
  ToolParameter,
  
  // Invoke
  InvokeRequest,
  InvokeResult,
  InvokePartialResult,
  InvokeCallback,
  
  // Stream
  StreamRequest,
  StreamChunk,
  StreamEventType,
  
  // Memory
  MemoryType,
  RetrievalStrategy,
  DistanceMetric,
  StoreMemoryRequest,
  SearchMemoryRequest,
  
  // Responses
  PingResponse,
  GraphResponse,
  StateSchemaResponse,
  ThreadStateResponse,
  
  // Errors
  AgentFlowError,
  AuthenticationError,
  NotFoundError,
  
  // Metadata
  ResponseMetadata
} from 'agentflow-react';
```

---

## Core Interfaces

### AgentFlowClient

The main client class for API interaction.

```typescript
class AgentFlowClient {
  constructor(config: AgentFlowConfig);
  
  // Health & Metadata
  ping(): Promise<PingResponse>;
  graph(): Promise<GraphResponse>;
  graphStateSchema(): Promise<StateSchemaResponse>;
  
  // Execution
  invoke(request: InvokeRequest): Promise<InvokeResult>;
  stream(request: StreamRequest): AsyncIterableIterator<StreamChunk>;
  
  // Tools
  registerTool(registration: ToolRegistration): void;
  setup(): Promise<void>;
  
  // Threads
  threads(request?: ThreadsRequest): Promise<ThreadsResponse>;
  threadDetails(threadId: string): Promise<ThreadDetailsResponse>;
  threadState(threadId: string): Promise<ThreadStateResponse>;
  updateThreadState(threadId: string, request: UpdateThreadStateRequest): Promise<UpdateThreadStateResponse>;
  clearThreadState(threadId: string): Promise<ClearThreadStateResponse>;
  deleteThread(threadId: string, request?: DeleteThreadRequest): Promise<DeleteThreadResponse>;
  
  // Messages
  threadMessages(threadId: string, options?: ThreadMessagesRequest): Promise<ThreadMessagesResponse>;
  threadMessage(threadId: string, messageId: string): Promise<ThreadMessageResponse>;
  addThreadMessages(threadId: string, request: AddThreadMessagesRequest): Promise<AddThreadMessagesResponse>;
  deleteThreadMessage(threadId: string, messageId: string): Promise<DeleteThreadMessageResponse>;
  
  // Memory
  storeMemory(request: StoreMemoryRequest): Promise<StoreMemoryResponse>;
  searchMemory(request: SearchMemoryRequest): Promise<SearchMemoryResponse>;
  getMemory(memoryId: string): Promise<GetMemoryResponse>;
  updateMemory(memoryId: string, request: UpdateMemoryRequest): Promise<UpdateMemoryResponse>;
  deleteMemory(memoryId: string): Promise<DeleteMemoryResponse>;
  listMemories(request?: ListMemoriesRequest): Promise<ListMemoriesResponse>;
  forgetMemories(request: ForgetMemoriesRequest): Promise<ForgetMemoriesResponse>;
}
```

### AgentFlowConfig

Client configuration options.

```typescript
interface AgentFlowConfig {
  baseUrl: string;        // Required: API base URL
  authToken?: string;     // Optional: Authentication token
  timeout?: number;       // Optional: Request timeout in ms (default: 300000)
  debug?: boolean;        // Optional: Enable debug logging (default: false)
}
```

**Example:**

```typescript
const config: AgentFlowConfig = {
  baseUrl: 'https://api.example.com',
  authToken: process.env.API_TOKEN,
  timeout: 60000,
  debug: true
};

const client: AgentFlowClient = new AgentFlowClient(config);
```

---

## Message Types

### Message

The main message class with helper methods.

```typescript
class Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: ContentBlock[];
  
  constructor(role: string, content: ContentBlock[]);
  
  // Static helper methods
  static user(text: string): Message;
  static assistant(text: string): Message;
  static system(text: string): Message;
  static tool_message(results: ToolResultBlock[]): Message;
  static text_message(text: string, role: string): Message;
}
```

### Content Blocks

```typescript
// Base content block types
type ContentBlock = 
  | TextBlock 
  | ImageBlock 
  | AudioBlock 
  | VideoBlock 
  | DocumentBlock
  | RemoteToolCallBlock 
  | ToolResultBlock;

// Text block
interface TextBlock {
  type: 'text';
  text: string;
  annotations?: AnnotationRef[];
}

// Image block
interface ImageBlock {
  type: 'image';
  media: MediaRef;
  alt_text?: string;
  bbox?: number[];
}

// Audio block
interface AudioBlock {
  type: 'audio';
  media: MediaRef;
  transcript?: string;
  sample_rate?: number;
  channels?: number;
}

// Video block
interface VideoBlock {
  type: 'video';
  media: MediaRef;
  transcript?: string;
  fps?: number;
}

// Document block
interface DocumentBlock {
  type: 'document';
  media: MediaRef;
  title?: string;
  format?: string;
}

// Remote tool call (from API)
interface RemoteToolCallBlock {
  type: 'remote_tool_call';
  id: string;
  name: string;
  args: Record<string, any>;
}

// Tool result (sent back to API)
interface ToolResultBlock {
  type: 'tool_result';
  call_id: string;
  output: any;
  status: 'completed' | 'failed';
  is_error: boolean;
}
```

### Media References

```typescript
interface MediaRef {
  kind: 'url' | 'file_id' | 'data';
  url?: string;
  file_id?: string;
  data_base64?: string;
  mime_type?: string;
  size_bytes?: number;
  sha256?: string;
  filename?: string;
  width?: number;
  height?: number;
  duration_ms?: number;
  page?: number;
}

interface AnnotationRef {
  url?: string;
  file_id?: string;
  page?: number;
  index?: number;
  title?: string;
}
```

**Example:**

```typescript
import { Message, TextBlock, ImageBlock, MediaRef } from 'agentflow-react';

// Simple text message
const userMessage: Message = Message.user('Hello');

// Message with multiple blocks
const complexMessage = new Message('user', [
  new TextBlock('Here is an image:'),
  new ImageBlock(
    new MediaRef('url', 'https://example.com/image.jpg'),
    'A beautiful landscape'
  )
]);
```

---

## Request & Response Types

### Invoke

```typescript
interface InvokeRequest {
  messages: Message[];
  config?: Record<string, any>;
  stream?: boolean;
  granularity?: 'low' | 'partial' | 'full';
  recursion_limit?: number;
  on_progress?: InvokeCallback;
}

interface InvokeResult {
  messages: Message[];
  all_messages: Message[];
  state?: Record<string, any>;
  context?: any;
  summary?: string;
  iterations: number;
  recursion_limit_reached: boolean;
  metadata: ResponseMetadata;
}

interface InvokePartialResult {
  messages: Message[];
  all_messages: Message[];
  state?: Record<string, any>;
  context?: any;
  iterations: number;
  recursion_limit_reached: boolean;
}

type InvokeCallback = (result: InvokePartialResult) => void;
```

**Example:**

```typescript
const request: InvokeRequest = {
  messages: [Message.user('What is the weather?')],
  granularity: 'full',
  recursion_limit: 10,
  on_progress: (partial: InvokePartialResult) => {
    console.log(`Iteration ${partial.iterations}`);
  }
};

const result: InvokeResult = await client.invoke(request);
```

### State Schema

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
  type: string;
  description?: string;
  default?: any;
  required?: boolean;
  enum?: any[];
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
}
```

**Example:**

```typescript
const schema: StateSchemaResponse = await client.graphStateSchema();

// Iterate fields
for (const [name, field] of Object.entries(schema.data.fields)) {
  const fieldSchema: FieldSchema = field;
  console.log(`${name}: ${fieldSchema.type}`);
}
```

### Thread State

```typescript
interface ThreadStateResponse {
  data: {
    state: Record<string, any>;
    [key: string]: any;
  };
  metadata: ResponseMetadata;
}

interface UpdateThreadStateRequest {
  config?: Record<string, any>;
  state: Record<string, any>;
}

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
// Get current state
const currentState: ThreadStateResponse = await client.threadState('thread_123');

// Update state
const updateRequest: UpdateThreadStateRequest = {
  state: {
    step: 'completed',
    result: { success: true }
  }
};

const updated: UpdateThreadStateResponse = await client.updateThreadState(
  'thread_123',
  updateRequest
);
```

---

## Tool Types

### Tool Registration

```typescript
interface ToolRegistration {
  node: string;
  name: string;
  description?: string;
  parameters?: ToolParameter;
  handler: ToolHandler;
}

interface ToolParameter {
  type: 'object';
  properties: Record<string, any>;
  required: string[];
}

type ToolHandler = (args: any) => Promise<any>;
```

**Example with Strong Typing:**

```typescript
// Define parameter interface
interface WeatherArgs {
  location: string;
  units?: 'metric' | 'imperial';
}

// Define result interface
interface WeatherResult {
  temperature: number;
  condition: string;
  humidity: number;
}

// Typed tool registration
const weatherTool: ToolRegistration = {
  node: 'assistant',
  name: 'get_weather',
  description: 'Get current weather',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' },
      units: { type: 'string', enum: ['metric', 'imperial'] }
    },
    required: ['location']
  },
  handler: async (args: WeatherArgs): Promise<WeatherResult> => {
    const data = await fetchWeather(args.location, args.units);
    return {
      temperature: data.temp,
      condition: data.condition,
      humidity: data.humidity
    };
  }
};

client.registerTool(weatherTool);
```

---

## Memory Types

### Memory Enums

```typescript
enum MemoryType {
  EPISODIC = "episodic",
  SEMANTIC = "semantic",
  PROCEDURAL = "procedural",
  ENTITY = "entity",
  RELATIONSHIP = "relationship",
  CUSTOM = "custom",
  DECLARATIVE = "declarative"
}

enum RetrievalStrategy {
  SIMILARITY = "similarity",
  TEMPORAL = "temporal",
  RELEVANCE = "relevance",
  HYBRID = "hybrid",
  GRAPH_TRAVERSAL = "graph_traversal"
}

enum DistanceMetric {
  COSINE = "cosine",
  EUCLIDEAN = "euclidean",
  DOT_PRODUCT = "dot_product",
  MANHATTAN = "manhattan"
}
```

### Memory Requests

```typescript
interface StoreMemoryRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  content: string;
  memory_type: MemoryType;
  category: string;
  metadata?: Record<string, any>;
}

interface SearchMemoryRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  query: string;
  memory_type?: MemoryType;
  category?: string;
  limit?: number;
  score_threshold?: number;
  filters?: Record<string, any>;
  retrieval_strategy?: RetrievalStrategy;
  distance_metric?: DistanceMetric;
  max_tokens?: number;
}

interface UpdateMemoryRequest {
  config?: Record<string, any>;
  options?: Record<string, any>;
  content?: string;
  memory_type?: MemoryType;
  category?: string;
  metadata?: Record<string, any>;
}
```

### Memory Result

```typescript
interface MemoryResult {
  id: string;
  content: string;
  score: number;
  memory_type: string;
  metadata: Record<string, any>;
  vector: number[];
  user_id: string;
  thread_id: string;
  timestamp: string;
}
```

**Example:**

```typescript
import { MemoryType, RetrievalStrategy, DistanceMetric } from 'agentflow-react';

// Store memory
const storeRequest: StoreMemoryRequest = {
  content: 'User prefers dark mode',
  memory_type: MemoryType.SEMANTIC,
  category: 'preferences',
  metadata: { user_id: 'user_123' }
};

await client.storeMemory(storeRequest);

// Search memory
const searchRequest: SearchMemoryRequest = {
  query: 'user interface preferences',
  memory_type: MemoryType.SEMANTIC,
  limit: 5,
  score_threshold: 0.7,
  retrieval_strategy: RetrievalStrategy.SIMILARITY,
  distance_metric: DistanceMetric.COSINE
};

const results = await client.searchMemory(searchRequest);

results.data.results.forEach((result: MemoryResult) => {
  console.log(`[${result.score.toFixed(2)}] ${result.content}`);
});
```

---

## Stream Types

### Stream Request & Events

```typescript
interface StreamRequest {
  messages: Message[];
  config?: Record<string, any>;
  stream?: boolean;
  granularity?: 'low' | 'partial' | 'full';
}

interface StreamChunk {
  event: StreamEventType;
  data: any;
}

type StreamEventType =
  | 'metadata'
  | 'on_chain_start'
  | 'on_chain_stream'
  | 'on_chain_end'
  | 'messages_chunk'
  | 'state_chunk'
  | 'context_chunk'
  | 'summary_chunk'
  | 'error';
```

**Example with Type Guards:**

```typescript
async function handleStream(messages: Message[]) {
  for await (const chunk of client.stream({ messages })) {
    switch (chunk.event) {
      case 'metadata':
        const metadata = chunk.data as ResponseMetadata;
        console.log('Request ID:', metadata.request_id);
        break;
        
      case 'messages_chunk':
        const text = chunk.data as string;
        process.stdout.write(text);
        break;
        
      case 'state_chunk':
        const state = chunk.data as Record<string, any>;
        console.log('State:', state);
        break;
        
      case 'error':
        const error = chunk.data as { message: string };
        console.error('Error:', error.message);
        break;
    }
  }
}
```

---

## Error Types

### Error Classes

```typescript
class AgentFlowError extends Error {
  status: number;
  requestId?: string;
  
  constructor(message: string, status: number, requestId?: string);
}

class BadRequestError extends AgentFlowError {
  constructor(message: string, requestId?: string);
}

class AuthenticationError extends AgentFlowError {
  constructor(message: string, requestId?: string);
}

class PermissionError extends AgentFlowError {
  constructor(message: string, requestId?: string);
}

class NotFoundError extends AgentFlowError {
  constructor(message: string, requestId?: string);
}

class ValidationError extends AgentFlowError {
  constructor(message: string, requestId?: string);
}

class ServerError extends AgentFlowError {
  constructor(message: string, status: number, requestId?: string);
}
```

**Example:**

```typescript
import { 
  AgentFlowError, 
  AuthenticationError, 
  NotFoundError 
} from 'agentflow-react';

try {
  const result = await client.invoke({ messages });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Auth failed:', error.message);
    console.error('Request ID:', error.requestId);
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found:', error.message);
  } else if (error instanceof AgentFlowError) {
    console.error(`Error ${error.status}:`, error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Type Guards

### Message Type Guards

```typescript
function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === 'text';
}

function isImageBlock(block: ContentBlock): block is ImageBlock {
  return block.type === 'image';
}

function isRemoteToolCall(block: ContentBlock): block is RemoteToolCallBlock {
  return block.type === 'remote_tool_call';
}

function isToolResult(block: ContentBlock): block is ToolResultBlock {
  return block.type === 'tool_result';
}
```

**Usage:**

```typescript
const message: Message = result.messages[0];

for (const block of message.content) {
  if (isTextBlock(block)) {
    console.log('Text:', block.text);
  } else if (isImageBlock(block)) {
    console.log('Image URL:', block.media.url);
  } else if (isRemoteToolCall(block)) {
    console.log('Tool call:', block.name, block.args);
  }
}
```

### Error Type Guards

```typescript
function isAgentFlowError(error: unknown): error is AgentFlowError {
  return error instanceof AgentFlowError;
}

function isAuthError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}
```

**Usage:**

```typescript
try {
  await client.invoke({ messages });
} catch (error) {
  if (isAuthError(error)) {
    // TypeScript knows error is AuthenticationError
    redirectToLogin(error.requestId);
  } else if (isNotFoundError(error)) {
    // TypeScript knows error is NotFoundError
    showNotFoundPage(error.message);
  } else if (isAgentFlowError(error)) {
    // TypeScript knows error is AgentFlowError
    logError(error.status, error.message);
  }
}
```

---

## Generic Types

### Typed Invoke Result

Create typed results for specific use cases:

```typescript
interface ChatResult extends InvokeResult {
  messages: Message[];
  conversationState: {
    topic: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  };
}

async function invokeChat(messages: Message[]): Promise<ChatResult> {
  const result = await client.invoke({
    messages,
    granularity: 'full'
  });
  
  return {
    ...result,
    conversationState: result.state as any
  };
}
```

### Typed Tool Handlers

```typescript
// Generic typed tool handler
type TypedToolHandler<TArgs, TResult> = (args: TArgs) => Promise<TResult>;

// Weather tool types
interface WeatherArgs {
  location: string;
  units?: 'metric' | 'imperial';
}

interface WeatherResult {
  temperature: number;
  condition: string;
}

const weatherHandler: TypedToolHandler<WeatherArgs, WeatherResult> = async (args) => {
  const data = await fetchWeather(args.location, args.units);
  return {
    temperature: data.temp,
    condition: data.condition
  };
};

client.registerTool({
  node: 'assistant',
  name: 'get_weather',
  handler: weatherHandler
});
```

---

## Custom Type Extensions

### Extend Client Configuration

```typescript
interface CustomAgentFlowConfig extends AgentFlowConfig {
  retryAttempts?: number;
  retryDelay?: number;
  customHeaders?: Record<string, string>;
}

class CustomAgentFlowClient extends AgentFlowClient {
  private retryAttempts: number;
  private retryDelay: number;
  
  constructor(config: CustomAgentFlowConfig) {
    super(config);
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }
  
  async invokeWithRetry(request: InvokeRequest): Promise<InvokeResult> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.invoke(request);
      } catch (error) {
        if (attempt === this.retryAttempts) throw error;
        await this.sleep(this.retryDelay * attempt);
      }
    }
    throw new Error('Max retries exceeded');
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Extend Message Types

```typescript
// Add custom message metadata
interface ExtendedMessage extends Message {
  metadata: {
    timestamp: Date;
    userId: string;
    sessionId: string;
  };
}

function createExtendedMessage(
  text: string,
  userId: string,
  sessionId: string
): ExtendedMessage {
  const message = Message.user(text) as ExtendedMessage;
  message.metadata = {
    timestamp: new Date(),
    userId,
    sessionId
  };
  return message;
}
```

### Custom Tool Types

```typescript
// Tool with middleware
interface ToolWithMiddleware extends ToolRegistration {
  beforeExecute?: (args: any) => Promise<void>;
  afterExecute?: (result: any) => Promise<void>;
}

function registerToolWithMiddleware(
  client: AgentFlowClient,
  tool: ToolWithMiddleware
) {
  const originalHandler = tool.handler;
  
  const wrappedHandler: ToolHandler = async (args) => {
    if (tool.beforeExecute) {
      await tool.beforeExecute(args);
    }
    
    const result = await originalHandler(args);
    
    if (tool.afterExecute) {
      await tool.afterExecute(result);
    }
    
    return result;
  };
  
  client.registerTool({
    ...tool,
    handler: wrappedHandler
  });
}
```

---

## Response Metadata

All API responses include metadata:

```typescript
interface ResponseMetadata {
  message: string;
  request_id: string;
  timestamp: string;
}
```

**Usage:**

```typescript
const result: InvokeResult = await client.invoke({ messages });

console.log('Request ID:', result.metadata.request_id);
console.log('Timestamp:', result.metadata.timestamp);
console.log('Message:', result.metadata.message);
```

---

## Complete Example

Here's a complete TypeScript example using all type features:

```typescript
import {
  AgentFlowClient,
  AgentFlowConfig,
  Message,
  InvokeRequest,
  InvokeResult,
  ToolRegistration,
  MemoryType,
  StoreMemoryRequest,
  SearchMemoryRequest,
  AuthenticationError,
  NotFoundError
} from 'agentflow-react';

// Configuration
const config: AgentFlowConfig = {
  baseUrl: process.env.AGENTFLOW_API_URL!,
  authToken: process.env.AGENTFLOW_TOKEN,
  timeout: 60000,
  debug: true
};

const client = new AgentFlowClient(config);

// Tool types
interface CalculatorArgs {
  expression: string;
}

interface CalculatorResult {
  result: number;
  expression: string;
}

// Register tool
const calculatorTool: ToolRegistration = {
  node: 'assistant',
  name: 'calculate',
  description: 'Perform calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: { type: 'string' }
    },
    required: ['expression']
  },
  handler: async (args: CalculatorArgs): Promise<CalculatorResult> => {
    const result = evaluateMath(args.expression);
    return { result, expression: args.expression };
  }
};

client.registerTool(calculatorTool);

// Invoke with types
async function chat(userInput: string): Promise<InvokeResult> {
  const request: InvokeRequest = {
    messages: [Message.user(userInput)],
    granularity: 'full',
    recursion_limit: 10
  };
  
  try {
    const result: InvokeResult = await client.invoke(request);
    
    // Store memory
    const memoryRequest: StoreMemoryRequest = {
      content: `User asked: ${userInput}`,
      memory_type: MemoryType.EPISODIC,
      category: 'conversations',
      metadata: {
        timestamp: new Date().toISOString(),
        result_iterations: result.iterations
      }
    };
    
    await client.storeMemory(memoryRequest);
    
    return result;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('Authentication failed:', error.requestId);
      throw new Error('Please check your API token');
    } else if (error instanceof NotFoundError) {
      console.error('Resource not found:', error.message);
      throw new Error('API endpoint not available');
    } else {
      throw error;
    }
  }
}

// Usage
const result = await chat('Calculate 123 * 456');
console.log('Response:', result.messages[0].content);
console.log('Iterations:', result.iterations);
console.log('Request ID:', result.metadata.request_id);
```

---

## See Also

- [API Reference](./api-reference.md) - Complete API documentation
- [Getting Started](./getting-started.md) - Quick start guide
- [React Integration](./react-integration.md) - Using types in React
- [Tools Guide](./tools-guide.md) - Tool type patterns
- [Troubleshooting](./troubleshooting.md) - Common TypeScript issues

---

**Pro Tip:** Enable strict mode in `tsconfig.json` for maximum type safety!
