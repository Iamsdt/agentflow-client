# Progressive Results (Streaming-like Behavior)

## Overview

The `invoke` API supports progressive result delivery through callbacks, allowing users to receive responses immediately after each API call without waiting for the entire tool execution loop to complete. This provides a streaming-like experience without requiring actual streaming APIs.

## Key Benefits

✅ **Immediate Feedback**: Users get responses as soon as the API returns, not after all iterations complete
✅ **Better UX**: Can show loading states, intermediate results, and tool execution status in real-time
✅ **Non-Blocking**: Tool execution happens between callbacks, users see progress immediately
✅ **Simple API**: Just provide a callback function, no complex streaming handling needed

## How It Works

```typescript
import { AgentFlowClient, Message, InvokePartialResult } from 'agentflow-react';

const client = new AgentFlowClient({
    baseUrl: 'http://localhost:8000',
    debug: true
});

// Register your tools
client.registerTool('get_weather', async (args) => {
    return `The weather in ${args.location} is sunny`;
}, 'weather_node');

const messages = [
    Message.text_message('What is the weather in San Francisco?', 'user')
];

// Invoke with progressive results callback
const result = await client.invoke(messages, {
    recursion_limit: 10,
    onPartialResult: async (partial: InvokePartialResult) => {
        console.log(`Iteration ${partial.iteration}:`);
        console.log(`- Messages: ${partial.messages.length}`);
        console.log(`- Has tool calls: ${partial.has_tool_calls}`);
        console.log(`- Is final: ${partial.is_final}`);
        
        // Display messages to user immediately
        partial.messages.forEach(msg => {
            displayMessage(msg); // Your UI update logic
        });
    }
});
```

## The InvokePartialResult Interface

```typescript
export interface InvokePartialResult {
    /** Current iteration number (1-based) */
    iteration: number;
    
    /** Messages received in this API response */
    messages: Message[];
    
    /** All messages accumulated so far */
    all_messages: Message[];
    
    /** Whether this response contains tool calls that need execution */
    has_tool_calls: boolean;
    
    /** Whether this is the final result (no more iterations) */
    is_final: boolean;
    
    /** The current agent state */
    state?: AgentState;
    
    /** Additional context information */
    context?: Message[];
    
    /** Summary if provided */
    summary?: string | null;
    
    /** Metadata from this iteration */
    meta?: any;
    
    /** Whether recursion limit was reached */
    recursion_limit_reached: boolean;
}
```

## Callback Execution Flow

1. **API Call**: Client sends request to `/v1/graph/invoke`
2. **Response Received**: Server returns messages, state, and metadata
3. **Callback Fires**: `onPartialResult` called immediately with partial result
4. **Tool Execution**: If remote tool calls exist, execute them locally (between callbacks)
5. **Loop Continues**: Send updated messages to API, callback fires again
6. **Completion**: Final callback with `is_final: true`, then return complete result

## Example: Multi-Iteration Scenario

```typescript
const result = await client.invoke(messages, {
    recursion_limit: 10,
    onPartialResult: async (partial: InvokePartialResult) => {
        if (partial.has_tool_calls) {
            // Show user that tools are being executed
            showLoadingIndicator('Executing tools...');
        } else if (partial.is_final) {
            // Show completion
            hideLoadingIndicator();
            showSuccess('Response complete!');
        }
        
        // Display each new message immediately
        partial.messages.forEach(msg => {
            if (msg.role === 'assistant') {
                displayAssistantMessage(msg);
            } else if (msg.role === 'tool') {
                displayToolResult(msg);
            }
        });
    }
});
```

## Server-Side vs Client-Side Tool Execution

The callback behavior differs slightly based on where tools are executed:

### Server-Side Tool Execution (Most Common)
When the server handles tool execution internally:
- Single iteration, callback fires once
- All messages (user query, assistant tool call, tool result, final answer) in one response
- `has_tool_calls: false` because server already executed them
- `is_final: true` on first callback

### Client-Side Tool Execution
When tools are registered locally and server returns tool calls:
- Multiple iterations, callback fires after each
- First callback: user query + assistant tool call
- Tool execution happens locally (not in callback)
- Second callback: tool result + assistant final answer
- User sees immediate feedback between iterations

## Best Practices

### 1. Keep Callbacks Fast
```typescript
onPartialResult: async (partial) => {
    // ✅ Good: Quick UI updates
    updateMessageList(partial.messages);
    
    // ❌ Bad: Slow operations block next iteration
    await heavyDatabaseWrite(partial.messages);
}
```

### 2. Handle All States
```typescript
onPartialResult: async (partial) => {
    if (partial.is_final) {
        hideLoader();
        enableInput();
    } else if (partial.has_tool_calls) {
        showLoader('Executing tools...');
    } else {
        showLoader('Thinking...');
    }
}
```

### 3. Display Progress
```typescript
let totalIterations = 0;

onPartialResult: async (partial) => {
    totalIterations++;
    updateProgressBar(totalIterations, recursion_limit);
    
    // Show token usage if available
    const usage = partial.messages.find(m => m.usages);
    if (usage) {
        displayTokenCount(usage.usages.total_tokens);
    }
}
```

### 4. Error Handling
```typescript
try {
    const result = await client.invoke(messages, {
        recursion_limit: 10,
        onPartialResult: async (partial) => {
            try {
                await updateUI(partial);
            } catch (error) {
                console.error('UI update failed:', error);
                // Don't throw - let invoke continue
            }
        }
    });
} catch (error) {
    // Handle invoke failure
    showError('Failed to get response');
}
```

## Comparison with Traditional Invoke

### Without Callback (Wait for Everything)
```typescript
// User sees nothing until complete
const result = await client.invoke(messages, { recursion_limit: 10 });

// Then display all at once
result.messages.forEach(displayMessage);
```

**Timeline**: 
```
[0s] Request sent
[2s] ...waiting...
[4s] ...waiting...
[6s] ...waiting...
[8s] All messages displayed at once
```

### With Callback (Progressive Display)
```typescript
const result = await client.invoke(messages, {
    recursion_limit: 10,
    onPartialResult: async (partial) => {
        partial.messages.forEach(displayMessage); // Immediate display
    }
});
```

**Timeline**:
```
[0s] Request sent
[2s] First messages displayed ← User sees progress!
[4s] More messages displayed
[6s] More messages displayed
[8s] Final messages displayed
```

## Real-World Example: Chat Interface

```typescript
import { AgentFlowClient, Message, InvokePartialResult } from 'agentflow-react';

// React component example
function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentIteration, setCurrentIteration] = useState(0);

    const sendMessage = async (text: string) => {
        const userMessage = Message.text_message(text, 'user');
        setMessages(prev => [...prev, userMessage]);
        setIsProcessing(true);

        try {
            await client.invoke([userMessage], {
                recursion_limit: 10,
                onPartialResult: async (partial: InvokePartialResult) => {
                    setCurrentIteration(partial.iteration);
                    
                    // Add new messages to display immediately
                    setMessages(prev => [...prev, ...partial.messages]);
                    
                    if (partial.has_tool_calls) {
                        setStatus('Executing tools...');
                    } else if (partial.is_final) {
                        setStatus('Complete');
                        setIsProcessing(false);
                    }
                }
            });
        } catch (error) {
            setError(error.message);
            setIsProcessing(false);
        }
    };

    return (
        <div>
            <MessageList messages={messages} />
            {isProcessing && (
                <StatusBar>
                    Processing iteration {currentIteration}...
                </StatusBar>
            )}
            <ChatInput onSend={sendMessage} disabled={isProcessing} />
        </div>
    );
}
```

## TypeScript Types

All types are exported from `agentflow-react`:

```typescript
import {
    InvokePartialResult,
    InvokeCallback,
    InvokeResult,
    InvokeRequest,
    Message,
    AgentState
} from 'agentflow-react';

// Callback type
type InvokeCallback = (partial: InvokePartialResult) => void | Promise<void>;

// Options interface
interface InvokeOptions {
    initial_state?: Record<string, any>;
    config?: Record<string, any>;
    recursion_limit?: number;
    response_granularity?: 'full' | 'partial' | 'low';
    onPartialResult?: InvokeCallback;  // Add your callback here
}
```

## Testing Progressive Results

See `check.ts` for a complete working example:

```bash
# Run the example
npm run build
node --loader ts-node/esm check.ts
```

The example demonstrates:
- Tool registration (get_weather, calculate)
- Progressive result callbacks
- Message display formatting
- Status tracking (has_tool_calls, is_final)
- Summary statistics

## Performance Considerations

1. **Network Latency**: Callbacks fire after each API response, so network speed affects timing
2. **Tool Execution Time**: Local tool execution happens between callbacks (not during)
3. **Callback Duration**: Keep callbacks fast (<100ms) to avoid blocking the next iteration
4. **Message Accumulation**: `all_messages` array grows with each iteration, consider memory in long conversations

## Migration Guide

### From Old API (Positional Parameters)
```typescript
// Old
const result = await client.invoke(
    messages,
    initial_state,
    config,
    recursion_limit
);
```

### To New API (Options Object)
```typescript
// New
const result = await client.invoke(messages, {
    initial_state,
    config,
    recursion_limit,
    onPartialResult: async (partial) => {
        // Handle progressive results
    }
});
```

## Related Documentation

- [Invoke API Reference](./invoke-api.md)
- [Tool Execution Guide](./tools.md)
- [Message Types](./messages.md)
- [State Management](./state.md)

## FAQ

**Q: Does this use server-sent events (SSE) or WebSockets?**
A: No, it uses regular HTTP POST requests. The "streaming-like" behavior comes from callbacks firing after each request in the loop.

**Q: Can I cancel an ongoing invoke?**
A: Not directly through the callback, but you can throw an error in the callback to abort (though this will fail the entire invoke).

**Q: What if my callback throws an error?**
A: The invoke will fail and the error will propagate to the caller. Keep callbacks robust.

**Q: How many times will the callback fire?**
A: Once per iteration. If server handles all tools internally, just once. If tools require multiple client-side executions, once per iteration.

**Q: Can I modify the messages in the callback?**
A: No, the callback receives a read-only view. Modifications won't affect the invoke loop.

**Q: Is the callback optional?**
A: Yes! If you don't provide `onPartialResult`, invoke works exactly like before (returns result at the end).
