# Invoke API with Tool Execution

This document explains how to use the `invoke` method with automatic tool execution loop.

## Overview

The `invoke` method allows you to interact with the AgentFlow API and automatically execute remote tools in a loop until completion or the recursion limit is reached.

## Architecture

### Flow Diagram

```
Client.invoke()
    ↓
Endpoint.invoke() [Loop starts here]
    ↓
1. POST /v1/graph/invoke
    ↓
2. Receive response
    ↓
3. Check for remote_tool_call blocks
    ↓
4. If found:
    - Execute tools locally via ToolExecutor
    - Create tool_message with results
    - Add to messages
    - Go to step 1 (next iteration)
    ↓
5. If not found or limit reached:
    - Return final result
```

### Key Components

1. **Client** (`src/client.ts`): 
   - User-facing API
   - Handles tool registration
   - Delegates invoke to endpoint

2. **Invoke Endpoint** (`src/endpoints/invoke.ts`):
   - Contains the recursion loop logic
   - Makes API calls to `/v1/graph/invoke`
   - Checks for remote tool calls
   - Executes tools via ToolExecutor
   - Tracks all intermediate results

3. **ToolExecutor** (`src/tools.ts`):
   - Executes registered tools
   - Manages tool registry by node
   - Converts tool results to messages

## Usage

### 1. Create Client and Register Tools

```typescript
import { AgentFlowClient, Message, ToolRegistration } from 'agentflow-react';

// Create client
const client = new AgentFlowClient({
    baseUrl: 'http://127.0.0.1:8000',
    authToken: null,
    debug: true
});

// Define a tool
const weatherTool: ToolRegistration = {
    node: 'weather_node',
    name: 'get_weather',
    description: 'Get current weather',
    parameters: {
        type: 'object',
        properties: {
            location: { type: 'string' }
        },
        required: ['location']
    },
    handler: async (args) => {
        // Your tool logic here
        return { temperature: 72, conditions: 'sunny' };
    }
};

// Register tool
client.registerTool(weatherTool);
```

### 2. Setup Tools (Optional)

```typescript
// Setup tools on server (dummy implementation for now)
await client.setup();
```

### 3. Invoke the Graph

```typescript
const messages = [
    Message.text_message('What is the weather?', 'user')
];

const result = await client.invoke(
    messages,
    {}, // initial_state
    {}, // config
    25, // recursion_limit (default: 25)
    'full' // response_granularity (default: 'full')
);

console.log('Iterations:', result.iterations);
console.log('Messages:', result.messages);
console.log('All messages:', result.all_messages);
```

## Request Format

```typescript
{
  messages: [
    {
      message_id: null,
      role: "user",
      content: [{ type: "text", text: "HI" }]
    }
  ],
  initial_state: {},
  config: {},
  recursion_limit: 25,
  response_granularity: "full" // or "partial" or "low"
}
```

## Response Format

### InvokeResult

```typescript
interface InvokeResult {
    messages: Message[];              // Final messages from last iteration
    state?: AgentState;               // Final state
    context?: Message[];              // Context messages
    summary?: string | null;          // Summary
    meta: InvokeMetadata;            // Metadata (thread_id, etc.)
    all_messages: Message[];         // ALL messages including intermediate
    iterations: number;              // Number of iterations performed
    recursion_limit_reached: boolean; // Whether limit was hit
}
```

### Response Granularity

- **`full`**: Complete response with all details (messages, context, summary, state, meta)
- **`partial`**: Key information with some details omitted (messages, context, summary, meta)
- **`low`**: Minimal response (only messages and meta)

## Tool Execution Loop

The invoke endpoint automatically handles the tool execution loop:

1. **Iteration 1**: Send initial messages → Receive response
2. **Check**: Does response contain `remote_tool_call` blocks?
3. **If YES**: 
   - Execute tools locally using ToolExecutor
   - Create `tool_message` with results
   - Add to message history
   - Go to next iteration
4. **If NO**: Return final result
5. **Stop**: When no tool calls or recursion_limit reached

### Example Flow

```
User: "What is 5 + 3?"

Iteration 1:
  Request: [user message: "What is 5 + 3?"]
  Response: [assistant message with remote_tool_call: calculate(5 + 3)]
  
Iteration 2:
  Execute: calculate(5 + 3) → {result: 8}
  Request: [tool_message: {result: 8}]
  Response: [assistant message: "The answer is 8"]
  
No more tool calls → Return result
```

## Tool Registration

### ToolRegistration Interface

```typescript
interface ToolRegistration {
    node: string;              // Node name where tool is used
    name: string;              // Tool name
    description?: string;      // Tool description
    parameters?: ToolParameter; // OpenAI-style parameters schema
    handler: ToolHandler;      // Async function to execute
}
```

### Tool Handler

```typescript
type ToolHandler = (args: any) => Promise<any>;
```

The handler receives the arguments from the `remote_tool_call` and should return the result.

## Error Handling

- Tools that throw errors will have `is_error: true` and `status: 'failed'` in the result
- The loop continues even if a tool fails
- Check `result.recursion_limit_reached` to see if limit was hit

## Best Practices

1. **Set reasonable recursion limits**: Default is 25, adjust based on your use case
2. **Handle tool errors gracefully**: Wrap tool logic in try-catch
3. **Use debug mode**: Enable `debug: true` to see detailed logs
4. **Track intermediate results**: Use `result.all_messages` to see the full conversation
5. **Validate tool parameters**: Use the `parameters` schema to define expected inputs

## Example

See `examples/invoke-example.ts` for a complete working example.

## API Reference

### AgentFlowClient.invoke()

```typescript
async invoke(
    messages: Message[],
    initial_state?: Record<string, any>,
    config?: Record<string, any>,
    recursion_limit: number = 25,
    response_granularity: 'full' | 'partial' | 'low' = 'full'
): Promise<InvokeResult>
```

### AgentFlowClient.registerTool()

```typescript
registerTool(registration: ToolRegistration): void
```

### AgentFlowClient.setup()

```typescript
async setup(): Promise<void>
```

Note: `setup()` is currently a dummy implementation. Future versions will send tool definitions to the server.
