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
console.log(`Found ${response.data.threads.length} threads`);

for (const thread of response.data.threads) {
  console.log(`${thread.thread_id}: ${thread.thread_name || 'Untitled'}`);
}

// Search threads
const searchResults = await client.threads({
  search: 'customer support',
  limit: 10
});

// Paginate through threads
const page1 = await client.threads({ offset: 0, limit: 20 });
const page2 = await client.threads({ offset: 20, limit: 20 });
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
// Delete a thread
const response = await client.deleteThread('thread_123');
console.log('Deleted:', response.data.success);

// With config
await client.deleteThread('thread_456', {
  config: {
    cascade: true  // Delete all related data
  }
});
```

**Warning:** This operation is permanent and cannot be undone. All messages, state, and metadata associated with the thread will be deleted.

---

## State Management

### Get Thread State

Retrieve the current state of a thread.

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
const response = await client.threadState('thread_123');
const state = response.data.state;

console.log('Current state:', state);
console.log('Step:', state.step);
console.log('Progress:', state.progress);
console.log('User data:', state.user_data);
```

**State Schema:**

To understand available state fields, use the [State Schema API](./state-schema-guide.md):

```typescript
const schema = await client.stateSchema();
console.log('Available fields:', schema.data.fields);
```

---

### Update Thread State

Update specific fields in the thread state.

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
  state: Record<string, any>;    // State values to update
  config?: Record<string, any>;  // Optional configuration
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
// Update single field
await client.updateThreadState('thread_123', {
  state: {
    step: 'processing'
  }
});

// Update multiple fields
await client.updateThreadState('thread_123', {
  state: {
    step: 'completed',
    progress: 100,
    result: {
      success: true,
      data: { ... }
    },
    updated_at: new Date().toISOString()
  }
});

// With validation config
await client.updateThreadState('thread_123', {
  state: {
    user_preference: 'dark_mode'
  },
  config: {
    validate: true,
    merge: true  // Merge with existing state
  }
});
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
console.log(`Found ${response.data.messages.length} messages`);

for (const message of response.data.messages) {
  console.log(`${message.role}: ${JSON.stringify(message.content)}`);
}

// Paginate messages
const recent = await client.threadMessages('thread_123', {
  offset: 0,
  limit: 10
});

// Get older messages
const older = await client.threadMessages('thread_123', {
  offset: 10,
  limit: 10
});
```

---

### Get Single Message

Get a specific message from a thread by ID.

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

console.log('Role:', message.role);
console.log('Content:', message.content);
```

---

### Add Messages

Add new messages to a thread.

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
  messages: Message[];           // Array of messages to add
  config?: Record<string, any>;  // Optional configuration
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

// Add user message
await client.addThreadMessages('thread_123', {
  messages: [
    Message.user('What is the weather today?')
  ]
});

// Add multiple messages
await client.addThreadMessages('thread_123', {
  messages: [
    Message.user('Tell me about your services'),
    Message.assistant('We offer three main services: A, B, and C'),
    Message.user('Tell me more about service B')
  ]
});

// Add system message
await client.addThreadMessages('thread_123', {
  messages: [
    Message.system('User preference: concise responses')
  ]
});
```

**Message Types:**

```typescript
// User message
Message.user('User input text')

// Assistant message
Message.assistant('Assistant response')

// System message
Message.system('System instructions')

// Tool message
Message.tool('Tool output')

// Message with content blocks
Message.assistant([
  { type: 'text', text: 'Here is the result:' },
  { type: 'data', data: { value: 42 } }
])
```

---

### Delete Message

Delete a specific message from a thread.

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
  await client.updateThreadState(threadId, {
    state: {
      user_id: userId,
      session_start: new Date().toISOString(),
      step: 'initialized',
      preferences: {}
    }
  });
  
  // Add welcome message
  await client.addThreadMessages(threadId, {
    messages: [
      Message.system('You are a helpful assistant'),
      Message.assistant('Hello! How can I help you today?')
    ]
  });
  
  return threadId;
}

// Handle user message
async function handleUserMessage(threadId: string, userInput: string) {
  // Add user message
  await client.addThreadMessages(threadId, {
    messages: [Message.user(userInput)]
  });
  
  // Get current state for context
  const state = await client.threadState(threadId);
  
  // Execute agent
  const result = await client.invoke({
    messages: [Message.user(userInput)],
    config: {
      thread_id: threadId,
      state: state.data.state
    }
  });
  
  // Update state based on result
  if (result.state) {
    await client.updateThreadState(threadId, {
      state: result.state
    });
  }
  
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
async function startWorkflow(threadId: string) {
  await client.updateThreadState(threadId, {
    state: {
      step: WorkflowStep.INIT,
      progress: 0,
      data: {},
      history: []
    }
  });
}

// Advance workflow
async function advanceWorkflow(threadId: string, data: any) {
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
  
  await client.updateThreadState(threadId, {
    state: {
      step: nextStep,
      progress,
      data: { ...current.data.state.data, ...data },
      history: [...current.data.state.history, currentStep]
    }
  });
}
```

### 3. Conversation History Export

```typescript
async function exportConversation(threadId: string) {
  // Get thread details
  const details = await client.threadDetails(threadId);
  
  // Get all messages
  const messagesResponse = await client.threadMessages(threadId, {
    limit: 1000  // Adjust as needed
  });
  
  // Get final state
  const stateResponse = await client.threadState(threadId);
  
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
    state: stateResponse.data.state,
    exported_at: new Date().toISOString()
  };
  
  return exportData;
}
```

### 4. Thread Cleanup Service

```typescript
async function cleanupOldThreads(daysOld: number = 30) {
  // Get all threads
  const threads = await client.threads({ limit: 1000 });
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const deletedThreads: string[] = [];
  
  for (const thread of threads.data.threads) {
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
  
  await client.updateThreadState(threadId, {
    state: {
      user_id: userId,
      purpose: purpose,
      created_at: new Date().toISOString(),
      step: 'initialized',
      data: {}
    }
  });
  
  return threadId;
}
```

### 3. Clean State for Long-Running Threads

```typescript
// Clear state periodically for long conversations
async function resetThreadState(threadId: string, keepFields: string[] = []) {
  const current = await client.threadState(threadId);
  const preserved: Record<string, any> = {};
  
  for (const field of keepFields) {
    if (current.data.state[field] !== undefined) {
      preserved[field] = current.data.state[field];
    }
  }
  
  await client.clearThreadState(threadId);
  
  if (Object.keys(preserved).length > 0) {
    await client.updateThreadState(threadId, { state: preserved });
  }
}

// Usage
await resetThreadState('thread_123', ['user_id', 'preferences']);
```

### 4. Handle Not Found Gracefully

```typescript
import { NotFoundError } from 'agentflow-react';

async function getOrCreateThread(threadId: string, userId: string) {
  try {
    const details = await client.threadDetails(threadId);
    return threadId;
  } catch (error) {
    if (error instanceof NotFoundError) {
      // Thread doesn't exist, create it
      await client.updateThreadState(threadId, {
        state: {
          user_id: userId,
          created_at: new Date().toISOString()
        }
      });
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
    const response = await client.threadMessages(threadId, {
      offset,
      limit
    });
    
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
await client.updateThreadState(threadId, {
  state: {
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
});
```

---

## Error Handling

All thread operations may throw errors. See [Error Handling Guide](./error-handling.md) for details.

```typescript
import {
  NotFoundError,
  ValidationError,
  PermissionError
} from 'agentflow-react';

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
} from 'agentflow-react';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});

async function conversationExample() {
  const threadId = 'thread_example_123';
  
  try {
    // 1. Check if thread exists
    try {
      await client.threadDetails(threadId);
      console.log('Thread exists');
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Initialize new thread
        await client.updateThreadState(threadId, {
          state: {
            user_id: 'user_123',
            created_at: new Date().toISOString(),
            step: 'init',
            message_count: 0
          }
        });
        console.log('Created new thread');
      }
    }
    
    // 2. Add messages
    await client.addThreadMessages(threadId, {
      messages: [
        Message.user('Hello, I need help')
      ]
    });
    
    // 3. Get current state
    const state = await client.threadState(threadId);
    console.log('Current state:', state.data.state);
    
    // 4. Execute agent (simplified)
    const result = await client.invoke({
      messages: [Message.user('Hello, I need help')],
      config: { thread_id: threadId }
    });
    
    // 5. Update state
    await client.updateThreadState(threadId, {
      state: {
        message_count: state.data.state.message_count + 1,
        last_message: new Date().toISOString()
      }
    });
    
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
