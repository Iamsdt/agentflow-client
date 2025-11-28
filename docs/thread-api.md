# Thread API Guide

Complete guide to managing conversation threads and messages in AgentFlow.

## Table of Contents

- [Overview](#overview)
- [Thread Lifecycle](#thread-lifecycle)
- [Thread Operations](#thread-operations)
  - [List Threads](#list-threads)
  - [Get Thread Details](#get-thread-details)
  - [Delete Thread](#delete-thread)
- [State Management](#state-management)
  - [Get Thread State](#get-thread-state)
  - [Update Thread State](#update-thread-state)
  - [Clear Thread State](#clear-thread-state)
- [Message Operations](#message-operations)
  - [List Messages](#list-messages)
  - [Get Single Message](#get-single-message)
  - [Add Messages](#add-messages)
  - [Delete Message](#delete-message)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

Threads represent individual conversation sessions in AgentFlow. Each thread maintains its own state, messages, and metadata. Use threads to organize conversations by user, topic, or session.

### Key Concepts

- **Thread**: A conversation session with messages and state
- **Thread State**: Persistent key-value storage for the thread
- **Messages**: Conversation turns (user, assistant, tool, etc.)
- **Metadata**: Additional information about the thread

---

## Thread Lifecycle

```
1. Create Thread (implicit)
        ↓
2. Add Messages / Update State
        ↓
3. Execute Agent (invoke/stream)
        ↓
4. Update State / Add More Messages
        ↓
5. Clear State or Delete Thread
```

---

## Thread Operations

### List Threads

Get all threads with optional search and pagination.

**Signature:**
```typescript
threads(
  search?: string,
  offset?: number,
  limit?: number
): Promise<ThreadsResponse>
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | undefined | Search query to filter threads |
| offset | number | No | 0 | Pagination offset |
| limit | number | No | undefined | Number of results to return |

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
console.log(`Found ${response.data.threads.length} threads`);

for (const thread of response.data.threads) {
  console.log(`${thread.thread_id}: ${thread.thread_name || 'Untitled'}`);
}

// Search threads
const searchResults = await client.threads('customer support', 0, 10);

// Paginate through threads
const page1 = await client.threads(undefined, 0, 20);
const page2 = await client.threads(undefined, 20, 20);
```

---

### Get Thread Details

Get detailed information about a specific thread.

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

console.log('Thread ID:', details.data.thread_id);
console.log('Name:', details.data.thread_name);
console.log('User:', details.data.user_id);
console.log('Created:', details.data.created_at);
console.log('Updated:', details.data.updated_at);
console.log('Metadata:', details.data.metadata);
```

---

### Delete Thread

Permanently delete a thread and all its associated data.

**Signature:**
```typescript
deleteThread(
  threadId: string | number,
  config?: Record<string, any>
): Promise<DeleteThreadResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| config | Record<string, any> | No | Optional configuration map |

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
// Delete a thread
const response = await client.deleteThread('thread_123');
console.log('Deleted:', response.data.success);

// With config
await client.deleteThread('thread_456', { cascade: true });
```

**Warning:** This operation is permanent and cannot be undone. All messages, state, and metadata associated with the thread will be deleted.

---

## State Management

### Get Thread State

Retrieve the current state of a thread.

**Signature:**
```typescript
threadState(threadId: number): Promise<ThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | number | Yes | Unique thread identifier |

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
const response = await client.threadState(123);
const state = response.data.state;

console.log('Current state:', state);
console.log('Step:', state.step);
console.log('Progress:', state.progress);
console.log('User data:', state.user_data);
```

**State Schema:**

To understand available state fields, use the [State Schema API](./state-schema-guide.md):

```typescript
const schema = await client.graphStateSchema();
console.log('Available fields:', schema.data.properties);
```

---

### Update Thread State

Update specific fields in the thread state.

**Signature:**
```typescript
updateThreadState(
  threadId: number,
  config: Record<string, any>,
  state: any
): Promise<UpdateThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | number | Yes | Unique thread identifier |
| config | Record<string, any> | Yes | Configuration map for the thread |
| state | any | Yes | New AgentState for the thread |

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
// Update single field
await client.updateThreadState(123, {}, { step: 'processing' });

// Update multiple fields
await client.updateThreadState(
  123,
  { validate: true }, // config
  {                   // state
    step: 'completed',
    progress: 100,
    result: {
      success: true,
      data: { /* ... */ }
    },
    updated_at: new Date().toISOString()
  }
);
```
```

**Merge Behavior:**

- Fields you specify are updated
- Fields you don't specify remain unchanged
- To delete a field, set it to `null`

```typescript
// Existing state: { step: 'init', progress: 0, data: {...} }

await client.updateThreadState('thread_123', {
  state: {
    step: 'processing',
    progress: 50
    // 'data' field remains unchanged
  }
});

// New state: { step: 'processing', progress: 50, data: {...} }
```

---

### Clear Thread State

Clear all state data from a thread.

**Signature:**
```typescript
clearThreadState(threadId: number): Promise<ClearThreadStateResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | number | Yes | Unique thread identifier |

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
const response = await client.clearThreadState(123);
console.log('State cleared:', response.data.success);
```

**Note:** This only clears the state. Messages remain intact. To delete everything, use `deleteThread()`.

---

## Message Operations

### List Messages

Get all messages from a thread with pagination.

**Signature:**
```typescript
threadMessages(
  threadId: string | number,
  search?: string,
  offset?: number,
  limit?: number
): Promise<ThreadMessagesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| search | string | No | Optional search term to filter messages |
| offset | number | No | Pagination offset (default: 0) |
| limit | number | No | Number of results to return |

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
console.log(`Found ${response.data.messages.length} messages`);

for (const message of response.data.messages) {
  console.log(`${message.role}: ${JSON.stringify(message.content)}`);
}

// Paginate messages
const recent = await client.threadMessages('thread_123', undefined, 0, 10);

// Get older messages
const older = await client.threadMessages('thread_123', undefined, 10, 10);
```

---

### Get Single Message

Get a specific message from a thread by ID.

**Signature:**
```typescript
singleMessage(
  threadId: string | number,
  messageId: string
): Promise<ThreadMessageResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
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
const response = await client.singleMessage('thread_123', 'msg_456');
const message = response.data.message;

console.log('Role:', message.role);
console.log('Content:', message.content);
```

---

### Add Messages

Add new messages to a thread.

**Signature:**
```typescript
addThreadMessages(
  threadId: string | number,
  messages: Message[],
  config?: Record<string, any>,
  metadata?: Record<string, any>
): Promise<AddThreadMessagesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| messages | Message[] | Yes | Array of messages to add |
| config | Record<string, any> | No | Configuration map (default: {}) |
| metadata | Record<string, any> | No | Optional metadata for the checkpoint |

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
import { Message } from '@10xscale/agentflow-client';

// Add user message
await client.addThreadMessages(
  'thread_123',
  [Message.text_message('What is the weather today?', 'user')]
);

// Add multiple messages
await client.addThreadMessages(
  'thread_123',
  [
    Message.text_message('Tell me about your services', 'user'),
    Message.text_message('We offer three main services: A, B, and C', 'assistant'),
    Message.text_message('Tell me more about service B', 'user')
  ],
  {},  // config
  { source: 'import' }  // metadata
);

// Add system message
await client.addThreadMessages('thread_123', {
  messages: [
    Message.text_message('User preference: concise responses', 'system')
  ]
});
```

**Message Types:**

```typescript
// User message
Message.text_message('User input text', 'user')

// Assistant message
Message.text_message('Assistant response', 'assistant')

// System message
Message.text_message('System instructions', 'system')

// Tool message
Message.tool_message([/* tool result blocks */])

// Message with content blocks
new Message('assistant', [
  new TextBlock('Here is the result:'),
  new DataBlock('application/json', JSON.stringify({ value: 42 }))
])
```

---

### Delete Message

Delete a specific message from a thread.

**Signature:**
```typescript
deleteMessage(
  threadId: string | number,
  messageId: string,
  config?: Record<string, any>
): Promise<DeleteThreadMessageResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| threadId | string \| number | Yes | Unique thread identifier |
| messageId | string | Yes | Unique message identifier |
| config | Record<string, any> | No | Optional configuration map |

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
const response = await client.deleteMessage('thread_123', 'msg_456');
console.log('Deleted:', response.data.success);
```

**Warning:** This operation is permanent and cannot be undone.

---

## Use Cases

### 1. Multi-User Chat Application

```typescript
// Create thread for each user session
async function initializeUserSession(userId: string) {
  const threadId = `thread_${userId}_${Date.now()}`;
  
  // Set initial state
  await client.updateThreadState(
    parseInt(threadId.split('_')[2]),  // thread ID as number
    {}, // config
    {   // state
      user_id: userId,
      session_start: new Date().toISOString(),
      step: 'initialized',
      preferences: {}
    }
  );
  
  // Add welcome message
  await client.addThreadMessages(
    threadId,
    [
      Message.text_message('You are a helpful assistant', 'system'),
      Message.text_message('Hello! How can I help you today?', 'assistant')
    ]
  );
  
  return threadId;
}

// Handle user message
async function handleUserMessage(threadId: string, userInput: string) {
  // Add user message
  await client.addThreadMessages(
    threadId,
    [Message.text_message(userInput, 'user')]
  );
  
  // Execute agent
  const result = await client.invoke(
    [Message.text_message(userInput, 'user')],
    { config: { thread_id: threadId } }
  );
  
  return result.messages;
}
```

### 2. Workflow State Machine

```typescript
// Define workflow steps
enum WorkflowStep {
  INIT = 'init',
  GATHERING_INFO = 'gathering_info',
  PROCESSING = 'processing',
  REVIEW = 'review',
  COMPLETED = 'completed'
}

// Initialize workflow
async function startWorkflow(threadId: number) {
  await client.updateThreadState(
    threadId,
    {}, // config
    {   // state
      step: WorkflowStep.INIT,
      progress: 0,
      data: {},
      history: []
    }
  );
}

// Advance workflow
async function advanceWorkflow(threadId: number, data: any) {
  const current = await client.threadState(threadId);
  const currentStep = current.data.state.step;
  
  let nextStep: WorkflowStep;
  let progress: number;
  
  switch (currentStep) {
    case WorkflowStep.INIT:
      nextStep = WorkflowStep.GATHERING_INFO;
      progress = 25;
      break;
    case WorkflowStep.GATHERING_INFO:
      nextStep = WorkflowStep.PROCESSING;
      progress = 50;
      break;
    case WorkflowStep.PROCESSING:
      nextStep = WorkflowStep.REVIEW;
      progress = 75;
      break;
    case WorkflowStep.REVIEW:
      nextStep = WorkflowStep.COMPLETED;
      progress = 100;
      break;
    default:
      throw new Error('Invalid workflow step');
  }
  
  await client.updateThreadState(
    threadId,
    {}, // config
    {   // state
      step: nextStep,
      progress,
      data: { ...current.data.state.data, ...data },
      history: [...current.data.state.history, currentStep]
    }
  );
}
```

### 3. Conversation History Export

```typescript
async function exportConversation(threadId: string | number) {
  // Get thread details
  const details = await client.threadDetails(threadId);
  
  // Get all messages
  const messagesResponse = await client.threadMessages(threadId, undefined, undefined, 1000);
  
  // Get final state (if threadId is a number)
  const stateResponse = typeof threadId === 'number' 
    ? await client.threadState(threadId)
    : null;
  
  // Create export
  const exportData = {
    thread: {
      id: details.data.thread_id,
      name: details.data.thread_name,
      created: details.data.created_at,
      updated: details.data.updated_at
    },
    messages: messagesResponse.data.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || null
    })),
    state: stateResponse?.data.state || null,
    exported_at: new Date().toISOString()
  };
  
  return exportData;
}
```

### 4. Thread Cleanup Service

```typescript
async function cleanupOldThreads(daysOld: number = 30) {
  // Get all threads
  const threadsResponse = await client.threads(undefined, undefined, 1000);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const deletedThreads: string[] = [];
  
  for (const thread of threadsResponse.data.threads) {
    if (thread.updated_at) {
      const updatedDate = new Date(thread.updated_at);
      
      if (updatedDate < cutoffDate) {
        try {
          await client.deleteThread(thread.thread_id);
          deletedThreads.push(thread.thread_id);
          console.log(`Deleted old thread: ${thread.thread_id}`);
        } catch (error) {
          console.error(`Failed to delete ${thread.thread_id}:`, error);
        }
      }
    }
  }
  
  console.log(`Cleaned up ${deletedThreads.length} old threads`);
  return deletedThreads;
}
```

---

## Best Practices

### 1. Use Descriptive Thread Names

```typescript
// ✅ Good: Descriptive names
const threadId = await createThread('Customer Support - Order #12345');
const threadId = await createThread('User: john@example.com - Account Setup');

// ❌ Bad: No name or unclear
const threadId = await createThread('Thread 1');
const threadId = await createThread('test');
```

### 2. Initialize State Early

```typescript
// ✅ Good: Initialize state when creating thread
async function createThread(userId: string, purpose: string) {
  const threadId = generateThreadId();
  
  await client.updateThreadState(
    threadId,
    {}, // config
    {   // state
      user_id: userId,
      purpose: purpose,
      created_at: new Date().toISOString(),
      step: 'initialized',
      data: {}
    }
  );
  
  return threadId;
}
```

### 3. Clean State for Long-Running Threads

```typescript
// Clear state periodically for long conversations
async function resetThreadState(threadId: number, keepFields: string[] = []) {
  const current = await client.threadState(threadId);
  const preserved: Record<string, any> = {};
  
  for (const field of keepFields) {
    if (current.data.state[field] !== undefined) {
      preserved[field] = current.data.state[field];
    }
  }
  
  await client.clearThreadState(threadId);
  
  if (Object.keys(preserved).length > 0) {
    await client.updateThreadState(threadId, {}, preserved);
  }
}

// Usage
await resetThreadState(123, ['user_id', 'preferences']);
```

### 4. Handle Not Found Gracefully

```typescript
import { NotFoundError } from '@10xscale/agentflow-client';

async function getOrCreateThread(threadId: number, userId: string) {
  try {
    const details = await client.threadDetails(threadId);
    return threadId;
  } catch (error) {
    if (error instanceof NotFoundError) {
      // Thread doesn't exist, create it
      await client.updateThreadState(
        threadId,
        {},
        {
          user_id: userId,
          created_at: new Date().toISOString()
        }
      );
      return threadId;
    }
    throw error;
  }
}
```

### 5. Paginate Large Message Lists

```typescript
// ✅ Good: Paginate for large conversations
async function getAllMessages(threadId: string): Promise<Message[]> {
  const allMessages: Message[] = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await client.threadMessages(threadId, undefined, offset, limit);
    
    allMessages.push(...response.data.messages);
    
    if (response.data.messages.length < limit) {
      break;  // No more messages
    }
    
    offset += limit;
  }
  
  return allMessages;
}
```

### 6. Store Metadata in State

```typescript
// ✅ Good: Use state for thread metadata
await client.updateThreadState(
  threadId,
  {}, // config
  {   // state
    user_id: 'user_123',
    session_start: new Date().toISOString(),
    user_agent: navigator.userAgent,
    language: 'en-US',
    timezone: 'America/New_York',
    metadata: {
      source: 'web_chat',
      campaign: 'summer_2024'
    }
  }
);
```

---

## Error Handling

All thread operations may throw errors. See [Error Handling Guide](./error-handling.md) for details.

```typescript
import {
  NotFoundError,
  ValidationError,
  PermissionError
} from '@10xscale/agentflow-client';

try {
  await client.threadDetails('thread_123');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Thread not found');
  } else if (error instanceof ValidationError) {
    console.log('Invalid thread ID format');
  } else if (error instanceof PermissionError) {
    console.log('No permission to access thread');
  }
}
```

---

## Complete Example

```typescript
import {
  AgentFlowClient,
  Message,
  NotFoundError
} from '@10xscale/agentflow-client';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});

async function conversationExample() {
  const threadId = 123;
  
  try {
    // 1. Check if thread exists
    try {
      await client.threadDetails(threadId);
      console.log('Thread exists');
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Initialize new thread
        await client.updateThreadState(
          threadId,
          {},
          {
            user_id: 'user_123',
            created_at: new Date().toISOString(),
            step: 'init',
            message_count: 0
          }
        );
        console.log('Created new thread');
      }
    }
    
    // 2. Add messages
    await client.addThreadMessages(
      threadId,
      [Message.text_message('Hello, I need help', 'user')]
    );
    
    // 3. Get current state
    const state = await client.threadState(threadId);
    console.log('Current state:', state.data.state);
    
    // 4. Execute agent (simplified)
    const result = await client.invoke(
      [Message.text_message('Hello, I need help', 'user')],
      { config: { thread_id: threadId } }
    );
    
    // 5. Update state
    await client.updateThreadState(
      threadId,
      {},
      {
        message_count: state.data.state.message_count + 1,
        last_message: new Date().toISOString()
      }
    );
    
    // 6. Get all messages
    const messages = await client.threadMessages(threadId);
    console.log(`Thread has ${messages.data.messages.length} messages`);
    
    // 7. Export conversation
    const exported = await exportConversation(threadId);
    console.log('Exported:', exported);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

conversationExample();
```

---

## See Also

- [API Reference](./api-reference.md) - Complete API documentation
- [State Schema Guide](./state-schema-guide.md) - Understanding state schema
- [Error Handling Guide](./error-handling.md) - Error handling patterns
- [Quick Start Guide](./QUICK_START_NEW.md) - Getting started guide
