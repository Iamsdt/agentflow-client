# Stream API - Real-time Streaming from AgentFlow

This document explains how to use the `streamInvoke` method for real-time streaming responses from the AgentFlow API.

## Overview

The `streamInvoke` method provides real-time streaming of responses from the agent graph using HTTP streaming (NDJSON format). Instead of waiting for the entire response like with `invoke`, the stream method yields chunks as they arrive from the server, enabling responsive, real-time user interfaces.

## Key Differences from `invoke`

| Aspect | `invoke` | `streamInvoke` |
|--------|---------|----------------|
| **Response Pattern** | Wait for entire result | Yield chunks in real-time |
| **Data Structure** | Single response object | Multiple `StreamChunk` objects |
| **Use Case** | Batch processing | Real-time UI updates, chat interfaces |
| **Return Type** | `Promise<InvokeResult>` | `AsyncGenerator<StreamChunk>` |
| **Tool Execution** | Automatic loop handling | Manual handling if needed |
| **Memory Usage** | Higher (loads all data) | Lower (processes incrementally) |
| **Callback Support** | Yes (onPartialResult) | No (use for-await loop) |

## Architecture

### Flow Diagram

```
Client.stream()
    ↓
Endpoint.stream() [Streaming starts]
    ↓
POST /v1/graph/stream (HTTP Streaming)
    ↓
ReadableStream receives NDJSON chunks
    ↓
Parse NDJSON line by line
    ↓
For each complete line:
    - Parse JSON to StreamChunk
    - Yield chunk to generator
    ↓
Consumer receives chunks via for-await loop
    ↓
Process/render based on event type:
    - 'message': AI/user message arrived
    - 'updates': State/context updated
    - 'state': Graph state changed
    - 'error': Error occurred
```

## Stream Chunk Structure

Each chunk yielded from the stream has this structure:

```typescript
interface StreamChunk {
    event: StreamEventType | string;           // Type of event: 'message', 'updates', 'state', 'error'
    message?: Message | null;                   // For 'message' events
    state?: AgentState | null;                  // For 'updates'/'state' events
    data?: any;                                 // For other event data
    thread_id?: string;                         // Conversation thread ID
    run_id?: string;                            // Execution run ID
    metadata?: Record<string, any>;             // Metadata (node, function_name, status, etc.)
    timestamp?: number;                         // UNIX timestamp
}
```

## Stream Event Types

```typescript
enum StreamEventType {
    MESSAGE = 'message',        // New message from agent or user
    UPDATES = 'updates',        // State/context updates
    STATE = 'state',            // State update
    ERROR = 'error'             // Error occurred
}
```

## Usage

### Basic Streaming Example

```typescript
import { AgentFlowClient, Message } from 'agentflow-react';

const client = new AgentFlowClient({
    baseUrl: 'http://127.0.0.1:8000',
    authToken: 'your-token',
    debug: false
});

// Create a message
const messages = [Message.text_message('Hello, what can you do?', 'user')];

// Stream the response
const stream = client.stream(messages, {
    response_granularity: 'low',
    recursion_limit: 25
});

// Iterate over stream chunks
for await (const chunk of stream) {
    console.log('Event:', chunk.event);
    console.log('Chunk:', chunk);
    
    switch (chunk.event) {
        case 'message':
            // Handle message (could be assistant response or user message)
            if (chunk.message) {
                console.log(`[${chunk.message.role}]: ${chunk.message.content}`);
            }
            break;
        case 'updates':
            // Handle state updates
            if (chunk.state) {
                console.log('State updated:', chunk.state);
            }
            break;
        case 'error':
            // Handle errors
            console.error('Error:', chunk.data);
            break;
    }
}

console.log('Stream completed');
```

### React Chat Component Example

```typescript
import { useEffect, useRef, useState } from 'react';
import { AgentFlowClient, Message } from 'agentflow-react';

function ChatComponent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const clientRef = useRef<AgentFlowClient>();

    useEffect(() => {
        clientRef.current = new AgentFlowClient({
            baseUrl: 'http://127.0.0.1:8000',
            debug: false
        });
    }, []);

    async function handleSendMessage(text: string) {
        if (!clientRef.current) return;

        // Add user message
        const userMsg = Message.text_message(text, 'user');
        setMessages(prev => [...prev, userMsg]);

        setIsStreaming(true);

        try {
            // Create streaming request with all previous messages
            const stream = clientRef.current.stream(
                [...messages, userMsg],
                {
                    response_granularity: 'low',
                    recursion_limit: 25
                }
            );

            let currentAssistantMessage: Message | null = null;

            for await (const chunk of stream) {
                if (chunk.event === 'message' && chunk.message) {
                    const msg = chunk.message;
                    
                    if (msg.role === 'assistant') {
                        if (!currentAssistantMessage) {
                            // New assistant message, add it to state
                            currentAssistantMessage = msg;
                            setMessages(prev => [...prev, msg]);
                        } else {
                            // Update existing assistant message
                            currentAssistantMessage = msg;
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = msg;
                                return updated;
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
        } finally {
            setIsStreaming(false);
        }
    }

    return (
        <div>
            {messages.map((msg, idx) => (
                <div key={idx} className={msg.role}>
                    {/* Render message content */}
                </div>
            ))}
            {isStreaming && <div>Streaming...</div>}
        </div>
    );
}

export default ChatComponent;
```

### Advanced: Stream with Tool Execution

For scenarios where the server sends remote tool calls during streaming, you can handle them manually:

```typescript
import { AgentFlowClient, Message, StreamEventType } from 'agentflow-react';

async function streamWithToolExecution(client: AgentFlowClient, userMessage: Message) {
    const stream = client.stream([userMessage], {
        response_granularity: 'low'
    });

    const allChunks: any[] = [];
    
    for await (const chunk of stream) {
        allChunks.push(chunk);

        if (chunk.event === 'message' && chunk.message) {
            const msg = chunk.message;
            
            // Check if message contains tool calls
            const hasToolCalls = msg.content?.some(
                (block: any) => block.type === 'remote_tool_call'
            );
            
            if (hasToolCalls && client.toolExecutor) {
                console.log('Tool calls detected in message');
                // Tool execution would be handled here if needed
            }
        }
    }

    return allChunks;
}
```

### Stream with Error Handling

```typescript
async function streamWithErrorHandling(
    client: AgentFlowClient,
    messages: Message[]
) {
    try {
        const stream = client.stream(messages, {
            response_granularity: 'partial',
            recursion_limit: 25
        });

        for await (const chunk of stream) {
            if (chunk.event === 'error') {
                console.error('Stream error:', chunk.data);
                // Handle error appropriately
                break;
            }

            // Process other events
            console.log('Received:', chunk.event);
        }
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                console.error('Stream timeout');
            } else {
                console.error('Stream error:', error.message);
            }
        }
    }
}
```

### Cancelling a Stream

```typescript
async function streamWithCancellation(
    client: AgentFlowClient,
    messages: Message[]
) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30s timeout

    try {
        const stream = client.stream(messages, {
            response_granularity: 'low'
        });

        for await (const chunk of stream) {
            console.log('Chunk:', chunk.event);

            // Cancel after receiving first message
            if (chunk.event === 'message') {
                abortController.abort();
                break;
            }
        }
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.log('Stream cancelled');
        } else {
            console.error('Error:', error);
        }
    } finally {
        clearTimeout(timeoutId);
    }
}
```

## Configuration Options

When calling `streamInvoke`, you can provide options:

```typescript
stream(
    messages: Message[],
    options?: {
        initial_state?: Record<string, any>;      // Initial state for the graph
        config?: Record<string, any>;             // Graph config
        recursion_limit?: number;                 // Max iterations (default: 25)
        response_granularity?: 'full' | 'partial' | 'low';  // Level of detail
    }
)
```

### Response Granularity

- **'full'**: Complete detailed responses
- **'partial'**: Intermediate updates during processing
- **'low'**: Minimal updates, optimized for streaming (recommended)

## Performance Considerations

1. **Memory Efficient**: Stream processes data incrementally without loading entire response into memory

2. **Responsive UI**: Chunks arrive as soon as they're generated, enabling real-time UI updates

3. **Network Streaming**: Uses HTTP/1.1 chunked encoding for efficient data transfer

4. **NDJSON Format**: Each line is a complete JSON object, easily parseable line-by-line

## Common Patterns

### Update UI on Each Message Chunk

```typescript
for await (const chunk of stream) {
    if (chunk.event === 'message') {
        updateChatUI(chunk.message);
    }
}
```

### Collect All Chunks Then Process

```typescript
const chunks: StreamChunk[] = [];
for await (const chunk of stream) {
    chunks.push(chunk);
}
// Process all chunks at once
processAllChunks(chunks);
```

### React Hook for Streaming

```typescript
function useStreamInvoke() {
    const [chunks, setChunks] = useState<StreamChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const startStream = async (
        client: AgentFlowClient,
        messages: Message[]
    ) => {
        setIsLoading(true);
        setChunks([]);

        try {
            const stream = client.stream(messages);
            for await (const chunk of stream) {
                setChunks(prev => [...prev, chunk]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { chunks, isLoading, startStream };
}
```

## Debugging

Enable debug logging to see stream details:

```typescript
const client = new AgentFlowClient({
    baseUrl: 'http://127.0.0.1:8000',
    debug: true  // Enables console logging
});

const stream = client.stream(messages);
for await (const chunk of stream) {
    // Debug logs will show in console
}
```

## Comparison with Invoke

**Use `invoke` when:**
- You need the entire result at once
- You want automatic tool execution loop handling
- You have callback-based patterns
- The response is relatively small

**Use `streamInvoke` when:**
- Building chat/conversational interfaces
- You want real-time streaming responses
- You need responsive UIs with incremental updates
- Handling large responses efficiently
- Network bandwidth is a concern
- You prefer async generator patterns

## API Reference

### Method Signature

```typescript
stream(
    messages: Message[],
    options?: {
        initial_state?: Record<string, any>;
        config?: Record<string, any>;
        recursion_limit?: number;
        response_granularity?: 'full' | 'partial' | 'low';
    }
): AsyncGenerator<StreamChunk, void, unknown>
```

### Endpoint

- **URL**: `/v1/graph/stream`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Response**: `application/json` (NDJSON format)
- **Streaming**: Yes (HTTP/1.1 chunked)

### Error Handling

The stream will throw errors for:
- Network failures
- HTTP errors (non-2xx status)
- Timeout (default 5 minutes)
- Invalid JSON in stream

Wrap in try-catch to handle these gracefully.

## Migration from Invoke to Stream

If you're using callbacks with `invoke`:

```typescript
// Before (with invoke)
await client.invoke(messages, {
    onPartialResult: (partial) => {
        console.log('Partial:', partial.messages);
    }
});

// After (with streamInvoke)
for await (const chunk of client.stream(messages)) {
    if (chunk.event === 'message') {
        console.log('Message:', chunk.message);
    }
}
```

## Troubleshooting

### Stream stops without completion

Check:
1. Network connection
2. Server is running and healthy
3. Authorization token is valid
4. Recursion limit not exceeded

### No chunks received

Verify:
1. Server is streaming (not hanging)
2. Response format is valid NDJSON
3. Timeout is not too short
4. Initial request is correct

### Memory usage increasing

Ensure:
1. You're not storing all chunks unnecessarily
2. The for-await loop completes properly
3. No infinite loops in chunk processing

## Examples Repository

See the `examples/` directory for complete working examples:
- `examples/stream-basic.ts` - Simple streaming example
- `examples/stream-react.tsx` - React component example
- `examples/stream-chat.ts` - Chat application pattern

---

## See Also

- **[React Integration](./react-integration.md)** - Using stream in React applications with hooks
- **[React Examples](./react-examples.md)** - Complete React streaming components
- **[Stream Quick Reference](./stream-quick-ref.md)** - Quick reference for stream events
- **[API Reference](./api-reference.md)** - Complete stream API documentation
- **[Invoke Usage Guide](./invoke-usage.md)** - Alternative synchronous API
- **[Tools Guide](./tools-guide.md)** - Using tools with streaming
- **[TypeScript Types](./typescript-types.md)** - Type definitions for streaming
- **[Troubleshooting](./troubleshooting.md)** - Common streaming issues

