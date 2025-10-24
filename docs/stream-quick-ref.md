# Stream API Quick Reference

## Installation & Setup

```typescript
import { AgentFlowClient, Message } from 'agentflow-react';

const client = new AgentFlowClient({
    baseUrl: 'http://localhost:8000',
    authToken: 'your-token',
    debug: true
});
```

## Basic Usage

```typescript
// Create messages
const messages = [Message.text_message('Hello!', 'user')];

// Stream the response
const stream = client.stream(messages);

// Iterate over chunks
for await (const chunk of stream) {
    console.log(chunk);
}
```

## Event Handling

```typescript
for await (const chunk of stream) {
    switch (chunk.event) {
        case 'message':
            console.log('Message:', chunk.message?.content);
            break;
        case 'updates':
            console.log('State updated');
            break;
        case 'state':
            console.log('State:', chunk.state);
            break;
        case 'error':
            console.error('Error:', chunk.data);
            break;
    }
}
```

## Options

```typescript
client.stream(messages, {
    initial_state: {},              // Initial state
    config: {},                     // Graph config
    recursion_limit: 25,            // Max iterations
    response_granularity: 'low'     // 'full' | 'partial' | 'low'
});
```

## Error Handling

```typescript
try {
    const stream = client.stream(messages);
    for await (const chunk of stream) {
        // Process chunk
    }
} catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('timeout')) {
            console.error('Timeout');
        } else {
            console.error('Error:', error.message);
        }
    }
}
```

## Collect All Chunks

```typescript
const chunks = [];
for await (const chunk of client.stream(messages)) {
    chunks.push(chunk);
}
console.log('Total chunks:', chunks.length);
```

## React Hook

```typescript
function useStream(client: AgentFlowClient) {
    const [chunks, setChunks] = useState([]);
    const [loading, setLoading] = useState(false);

    const stream = async (messages: Message[]) => {
        setLoading(true);
        for await (const chunk of client.stream(messages)) {
            setChunks(prev => [...prev, chunk]);
        }
        setLoading(false);
    };

    return { chunks, loading, stream };
}
```

## Type Imports

```typescript
import {
    StreamChunk,
    StreamEventType,
    StreamContext,
    StreamRequest,
    StreamMetadata
} from 'agentflow-react';
```

## Common Patterns

### Print streaming messages
```typescript
for await (const chunk of stream) {
    if (chunk.event === 'message' && chunk.message?.role === 'assistant') {
        process.stdout.write(chunk.message.content[0]?.text || '');
    }
}
```

### Accumulate response
```typescript
let fullResponse = '';
for await (const chunk of stream) {
    if (chunk.event === 'message') {
        const text = chunk.message?.content[0]?.text || '';
        fullResponse += text;
    }
}
```

### Track progress
```typescript
let count = 0;
for await (const chunk of stream) {
    if (chunk.event === 'message') {
        count++;
        console.log(`Message ${count} received`);
    }
}
```

### Timeout handling
```typescript
const timeoutId = setTimeout(() => {
    // Handle timeout
}, 30000);

try {
    for await (const chunk of stream) {
        // Process
    }
} finally {
    clearTimeout(timeoutId);
}
```

## Comparison with Invoke

**Use `streamInvoke` for:**
- Chat interfaces
- Real-time updates
- Large responses
- Responsive UIs

**Use `invoke` for:**
- Batch processing
- Automatic tool loops
- Callback patterns
- Full result needed at once

## Debugging

Enable debug logging:
```typescript
const client = new AgentFlowClient({
    baseUrl: 'http://localhost:8000',
    debug: true  // Enables console logs
});
```

Check chunk events:
```typescript
for await (const chunk of stream) {
    console.debug('Event:', chunk.event);
    console.debug('Chunk:', JSON.stringify(chunk, null, 2));
}
```

## API Endpoint

- **URL**: `/v1/graph/stream`
- **Method**: `POST`
- **Format**: NDJSON (newline-delimited JSON)
- **Auth**: Bearer token (optional)

## Configuration Defaults

- Timeout: 5 minutes
- Recursion limit: 25
- Response granularity: 'low'
- Initial state: undefined
- Config: undefined

## Performance Tips

1. Use `response_granularity: 'low'` for less data
2. Process chunks incrementally
3. Don't store unnecessary chunks
4. Use proper error handling
5. Set appropriate timeout
6. Monitor memory usage

