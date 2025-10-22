# Quick Start: Invoke with Tool Execution

## 30-Second Setup

```typescript
import { AgentFlowClient, Message } from 'agentflow-react';

// 1. Create client
const client = new AgentFlowClient({
    baseUrl: 'http://localhost:8000',
    debug: true
});

// 2. Register a tool
client.registerTool({
    node: 'my_node',
    name: 'my_tool',
    description: 'Does something useful',
    parameters: {
        type: 'object',
        properties: {
            arg1: { type: 'string' }
        },
        required: ['arg1']
    },
    handler: async (args) => {
        // Your logic here
        return { result: 'success' };
    }
});

// 3. Setup tools (optional, dummy for now)
await client.setup();

// 4. Invoke
const result = await client.invoke([
    Message.text_message('Hello!', 'user')
]);

// 5. Use results
console.log('Final:', result.messages);
console.log('All history:', result.all_messages);
console.log('Iterations:', result.iterations);
```

## How It Works

1. **Send message** → Server responds
2. **Server says**: "Execute `my_tool` with these args"
3. **Client executes** tool locally
4. **Client sends** tool result back
5. **Server responds** with final answer
6. **Repeat** until done or limit reached

## Key Points

- ✅ Loop runs automatically in the invoke endpoint
- ✅ Tools execute locally on your machine
- ✅ All intermediate steps are tracked
- ✅ Recursion limit prevents infinite loops (default: 25)
- ✅ Full debug logging available

## API Reference

### Client Methods

```typescript
// Register a tool
client.registerTool(registration: ToolRegistration): void

// Setup tools on server (dummy)
client.setup(): Promise<void>

// Invoke with auto tool execution
client.invoke(
    messages: Message[],
    initial_state?: Record<string, any>,
    config?: Record<string, any>,
    recursion_limit?: number,
    response_granularity?: 'full' | 'partial' | 'low'
): Promise<InvokeResult>
```

### Result Structure

```typescript
interface InvokeResult {
    messages: Message[];              // Final messages
    all_messages: Message[];         // Complete history
    iterations: number;              // How many loops
    recursion_limit_reached: boolean; // Hit limit?
    state?: AgentState;              // Final state
    context?: Message[];             // Context
    summary?: string;                // Summary
    meta: InvokeMetadata;           // Metadata
}
```

## Common Patterns

### Pattern 1: Simple Tool

```typescript
client.registerTool({
    node: 'calculator',
    name: 'add',
    handler: async ({ a, b }) => ({ result: a + b })
});
```

### Pattern 2: Async Tool (API Call)

```typescript
client.registerTool({
    node: 'weather',
    name: 'get_weather',
    handler: async ({ location }) => {
        const response = await fetch(`/api/weather?loc=${location}`);
        return response.json();
    }
});
```

### Pattern 3: Error Handling

```typescript
client.registerTool({
    node: 'validator',
    name: 'validate',
    handler: async (args) => {
        try {
            // Validation logic
            return { valid: true };
        } catch (error) {
            throw new Error(`Validation failed: ${error.message}`);
        }
    }
});
```

## Debugging

```typescript
const client = new AgentFlowClient({
    baseUrl: 'http://localhost:8000',
    debug: true  // 👈 Enable detailed logging
});
```

This will log:
- Each API call
- Tool executions
- Iteration progress
- Final results

## Complete Example

See `examples/invoke-example.ts` for a full working example.

## Full Documentation

See `docs/invoke-usage.md` for complete documentation.
