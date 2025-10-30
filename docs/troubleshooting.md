# Troubleshooting Guide

Common issues and solutions for agentflow-react.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Connection & Authentication](#connection--authentication)
- [Timeout Problems](#timeout-problems)
- [Tool Execution Issues](#tool-execution-issues)
- [Stream Connection Issues](#stream-connection-issues)
- [TypeScript Compilation Errors](#typescript-compilation-errors)
- [React Integration Issues](#react-integration-issues)
- [Message & State Issues](#message--state-issues)
- [Debugging Tips](#debugging-tips)
- [FAQ](#faq)

---

## Installation Issues

### Problem: `npm install` fails with peer dependency warnings

```
npm WARN ERESOLVE overriding peer dependency
npm WARN Found: react@17.0.2
```

**Solution:**

The library requires React 18.0 or higher. Upgrade React:

```bash
npm install react@latest react-dom@latest
```

Or if you must use React 17, use `--legacy-peer-deps`:

```bash
npm install agentflow-react --legacy-peer-deps
```

---

### Problem: TypeScript types not found

```
Could not find a declaration file for module 'agentflow-react'
```

**Solution:**

The library includes TypeScript definitions. If they're not found:

1. Check your `tsconfig.json` includes `node_modules`:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

2. Try reinstalling:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Problem: Module not found errors in Next.js

```
Module not found: Can't resolve 'agentflow-react'
```

**Solution:**

Next.js App Router requires client-side components:

```typescript
'use client';  // Add this at the top

import { AgentFlowClient } from 'agentflow-react';
```

---

## Connection & Authentication

### Problem: `401 Unauthorized` error

```
AuthenticationError: Authentication failed (401)
Request ID: req_abc123
```

**Causes:**
- Missing or incorrect auth token
- Token expired
- Wrong API endpoint

**Solutions:**

1. **Verify your auth token:**
   ```typescript
   const client = new AgentFlowClient({
     baseUrl: 'https://api.example.com',
     authToken: process.env.AGENTFLOW_TOKEN,  // ✅ Use env variable
     debug: true  // Enable to see request details
   });
   ```

2. **Check token in request headers:**
   Enable debug mode to see the actual request:
   ```typescript
   const client = new AgentFlowClient({
     baseUrl: 'https://api.example.com',
     authToken: 'your-token',
     debug: true  // Will log headers
   });
   ```

3. **Verify API endpoint:**
   Ensure `baseUrl` matches your API server:
   ```typescript
   // Local development
   baseUrl: 'http://localhost:8000'
   
   // Production
   baseUrl: 'https://api.agentflow.example.com'
   ```

---

### Problem: `ECONNREFUSED` - Connection refused

```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Causes:**
- API server is not running
- Wrong port or host
- Firewall blocking connection

**Solutions:**

1. **Check if server is running:**
   ```bash
   # Test connection
   curl http://localhost:8000/v1/ping
   ```

2. **Verify baseUrl:**
   ```typescript
   // Check port and protocol
   const client = new AgentFlowClient({
     baseUrl: 'http://localhost:8000',  // Not https for local
     debug: true
   });
   ```

3. **Check firewall settings:**
   - Ensure port 8000 (or your port) is open
   - Try a different port if blocked

---

### Problem: `CORS` errors in browser

```
Access to fetch at 'https://api.example.com' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Cause:**
Server doesn't allow requests from your origin.

**Solutions:**

1. **Server-side fix (recommended):**
   Configure your API server to allow your origin:
   ```python
   # In your FastAPI/Flask server
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Use server-side API calls:**
   Make API calls from Next.js API routes instead of client-side:
   ```typescript
   // app/api/agent/route.ts
   export async function POST(request: Request) {
     const client = new AgentFlowClient({
       baseUrl: process.env.AGENTFLOW_API_URL
     });
     
     const result = await client.invoke(/* ... */);
     return Response.json(result);
   }
   ```

---

## Timeout Problems

### Problem: Request timeout after 5 minutes

```
TimeoutError: Request timed out after 300000ms
Request ID: req_abc123
```

**Cause:**
Default timeout is 5 minutes (300,000ms). Long-running operations exceed this.

**Solutions:**

1. **Increase timeout:**
   ```typescript
   const client = new AgentFlowClient({
     baseUrl: 'https://api.example.com',
     timeout: 600000  // 10 minutes (in milliseconds)
   });
   ```

2. **Use streaming for long operations:**
   Stream provides feedback during processing:
   ```typescript
   for await (const chunk of client.stream({ messages })) {
     // Process chunks as they arrive
     // No timeout needed for streaming
   }
   ```

3. **Optimize recursion limit:**
   Reduce tool execution iterations:
   ```typescript
   const result = await client.invoke({
     messages: [Message.user('...')],
     recursion_limit: 10  // Default is 25
   });
   ```

---

### Problem: Stream disconnects randomly

```
Stream ended unexpectedly
```

**Causes:**
- Network issues
- Server timeout
- Proxy/load balancer timeout

**Solutions:**

1. **Implement reconnection logic:**
   ```typescript
   async function streamWithRetry(messages: Message[], maxRetries = 3) {
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
       try {
         for await (const chunk of client.stream({ messages })) {
           yield chunk;
         }
         return;  // Success
       } catch (error) {
         if (attempt === maxRetries) throw error;
         console.log(`Retry ${attempt}/${maxRetries}...`);
         await sleep(1000 * attempt);  // Exponential backoff
       }
     }
   }
   ```

2. **Add keep-alive headers:**
   Configure your HTTP client with keep-alive:
   ```typescript
   // In your client configuration
   {
     timeout: 600000,
     headers: {
       'Connection': 'keep-alive',
       'Keep-Alive': 'timeout=600'
     }
   }
   ```

---

## Tool Execution Issues

### Problem: Tools not executing

```
Tool 'get_weather' not found
```

**Causes:**
- Tool not registered before invoke
- Wrong tool name
- Wrong node name

**Solutions:**

1. **Register tools before invoke:**
   ```typescript
   // ✅ CORRECT ORDER
   const client = new AgentFlowClient({ baseUrl: '...' });
   
   // Register first
   client.registerTool({
     node: 'assistant',
     name: 'get_weather',
     handler: async (args) => { /* ... */ }
   });
   
   // Then invoke
   await client.invoke({ messages: [...] });
   ```

2. **Verify tool name matches:**
   ```typescript
   // Tool registration
   name: 'get_weather'
   
   // API returns this exact name in remote_tool_call
   {
     type: 'remote_tool_call',
     name: 'get_weather',  // Must match exactly
     args: { location: 'Paris' }
   }
   ```

3. **Check node name:**
   ```typescript
   client.registerTool({
     node: 'assistant',  // Must match your agent graph node
     name: 'get_weather',
     // ...
   });
   ```

---

### Problem: Tool handler errors not showing

```
Tool executed but error not visible
```

**Solution:**

Enable debug mode to see tool execution:

```typescript
const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  debug: true  // Shows tool execution and errors
});

client.registerTool({
  node: 'assistant',
  name: 'my_tool',
  handler: async (args) => {
    console.log('Tool called with:', args);  // Debug logging
    
    try {
      const result = await someOperation(args);
      console.log('Tool result:', result);
      return result;
    } catch (error) {
      console.error('Tool error:', error);
      throw error;  // Re-throw to send error to agent
    }
  }
});
```

---

### Problem: Recursion limit reached

```
{
  recursion_limit_reached: true,
  iterations: 25
}
```

**Cause:**
Agent is stuck in a tool loop, hitting the max iteration limit.

**Solutions:**

1. **Increase recursion limit:**
   ```typescript
   const result = await client.invoke({
     messages: [...],
     recursion_limit: 50  // Increase if needed
   });
   ```

2. **Fix tool logic:**
   Ensure tools return clear results that help agent move forward:
   ```typescript
   // ❌ BAD: Vague result that might cause loops
   return { status: 'ok' };
   
   // ✅ GOOD: Clear, actionable result
   return {
     success: true,
     temperature: 72,
     condition: 'sunny',
     message: 'Weather data successfully retrieved'
   };
   ```

3. **Use callback to monitor iterations:**
   ```typescript
   const result = await client.invoke({
     messages: [...],
     recursion_limit: 25,
     on_progress: (partial) => {
       console.log(`Iteration ${partial.iterations}`);
       if (partial.iterations > 15) {
         console.warn('Approaching recursion limit!');
       }
     }
   });
   ```

---

## Stream Connection Issues

### Problem: Stream not yielding chunks

```typescript
for await (const chunk of client.stream({ messages })) {
  // Never enters this block
}
```

**Causes:**
- Network issues
- Wrong endpoint
- SSE not supported by infrastructure

**Solutions:**

1. **Verify endpoint supports SSE:**
   ```bash
   curl -N http://localhost:8000/v1/graph/stream \
     -H "Content-Type: application/json" \
     -H "Accept: text/event-stream" \
     -d '{"messages": [...]}'
   ```

2. **Check for proxy issues:**
   Some proxies buffer SSE streams. Try direct connection:
   ```typescript
   const client = new AgentFlowClient({
     baseUrl: 'http://localhost:8000',  // Direct, bypass proxy
     debug: true
   });
   ```

3. **Add error handling:**
   ```typescript
   try {
     for await (const chunk of client.stream({ messages })) {
       console.log('Chunk received:', chunk.event);
     }
   } catch (error) {
     console.error('Stream error:', error);
   }
   ```

---

### Problem: Partial content not updating UI

```typescript
// UI not updating as chunks arrive
```

**Solution:**

Ensure you're updating state on each chunk:

```typescript
const [content, setContent] = useState('');

async function handleStream() {
  let accumulated = '';
  
  for await (const chunk of client.stream({ messages })) {
    if (chunk.event === 'messages_chunk') {
      accumulated += chunk.data;
      setContent(accumulated);  // ✅ Update state each chunk
    }
  }
}
```

React 18+ with automatic batching:
```typescript
const [content, setContent] = useState('');

async function handleStream() {
  for await (const chunk of client.stream({ messages })) {
    if (chunk.event === 'messages_chunk') {
      // Use functional update for accurate state
      setContent(prev => prev + chunk.data);
    }
  }
}
```

---

## TypeScript Compilation Errors

### Problem: Type inference not working

```typescript
const result = await client.invoke({ messages });
// result type is 'any'
```

**Solution:**

Import and use proper types:

```typescript
import { AgentFlowClient, InvokeResult, Message } from 'agentflow-react';

const client: AgentFlowClient = new AgentFlowClient({ /* ... */ });

const result: InvokeResult = await client.invoke({
  messages: [Message.user('Hello')]
});

// Now result.messages, result.state, etc. are properly typed
```

---

### Problem: Message type errors

```typescript
// Error: Argument of type 'string' is not assignable to parameter of type 'Message'
client.invoke({ messages: ['Hello'] });
```

**Solution:**

Use Message helper methods:

```typescript
import { Message } from 'agentflow-react';

// ✅ Correct
const messages = [
  Message.user('Hello'),
  Message.assistant('Hi there!')
];

// Or with type
const messages: Message[] = [
  Message.text_message('Hello', 'user')
];

await client.invoke({ messages });
```

---

### Problem: Tool handler type errors

```typescript
handler: (args) => {
  // 'args' is implicitly 'any'
}
```

**Solution:**

Define parameter interfaces:

```typescript
interface WeatherArgs {
  location: string;
  units?: 'metric' | 'imperial';
}

interface WeatherResult {
  temperature: number;
  condition: string;
  humidity: number;
}

client.registerTool({
  node: 'assistant',
  name: 'get_weather',
  handler: async (args: WeatherArgs): Promise<WeatherResult> => {
    // Now args.location is typed
    const data = await fetchWeather(args.location);
    return {
      temperature: data.temp,
      condition: data.condition,
      humidity: data.humidity
    };
  }
});
```

---

## React Integration Issues

### Problem: Client recreated on every render

```typescript
function MyComponent() {
  // ❌ New client instance on every render!
  const client = new AgentFlowClient({ baseUrl: '...' });
  // ...
}
```

**Solution:**

Use `useMemo` or Context:

```typescript
import { useMemo } from 'react';

function MyComponent() {
  // ✅ Client created once
  const client = useMemo(() => {
    return new AgentFlowClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL!
    });
  }, []);
  
  // Use client
}
```

Or better, use Context Provider:

```typescript
// context/AgentFlowContext.tsx
const AgentFlowContext = createContext<AgentFlowClient | null>(null);

export function AgentFlowProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    return new AgentFlowClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL!
    });
  }, []);
  
  return (
    <AgentFlowContext.Provider value={client}>
      {children}
    </AgentFlowContext.Provider>
  );
}

// In components
function MyComponent() {
  const client = useContext(AgentFlowContext);
  // ...
}
```

---

### Problem: Async state not updating

```typescript
const [result, setResult] = useState(null);

async function handleInvoke() {
  const data = await client.invoke({ messages });
  setResult(data);  // Not updating?
}
```

**Solutions:**

1. **Check component is still mounted:**
   ```typescript
   useEffect(() => {
     let isMounted = true;
     
     async function fetchData() {
       const data = await client.invoke({ messages });
       if (isMounted) {
         setResult(data);
       }
     }
     
     fetchData();
     
     return () => {
       isMounted = false;
     };
   }, [messages]);
   ```

2. **Use proper async patterns:**
   ```typescript
   const [loading, setLoading] = useState(false);
   const [result, setResult] = useState(null);
   const [error, setError] = useState(null);
   
   async function handleInvoke() {
     setLoading(true);
     setError(null);
     
     try {
       const data = await client.invoke({ messages });
       setResult(data);
     } catch (err) {
       setError(err);
     } finally {
       setLoading(false);
     }
   }
   ```

---

### Problem: Infinite re-render loop

```typescript
function MyComponent() {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // ❌ Creates new array every render
    setMessages([Message.user('Hello')]);
  }, []);  // Missing dependency warning
}
```

**Solution:**

Initialize state properly:

```typescript
function MyComponent() {
  // ✅ Initialize once
  const [messages, setMessages] = useState(() => [
    Message.user('Hello')
  ]);
  
  // Or if you must use useEffect
  useEffect(() => {
    setMessages([Message.user('Hello')]);
  }, []);  // Empty array = run once
}
```

---

## Message & State Issues

### Problem: Empty response messages

```typescript
const result = await client.invoke({ messages });
console.log(result.messages);  // []
```

**Causes:**
- Wrong granularity level
- API error not caught
- Empty response from agent

**Solutions:**

1. **Check granularity:**
   ```typescript
   const result = await client.invoke({
     messages: [...],
     granularity: 'full'  // Ensure full response
   });
   ```

2. **Check all_messages:**
   ```typescript
   // result.messages = final response only
   // result.all_messages = all messages including tool calls
   
   console.log('Final:', result.messages);
   console.log('All:', result.all_messages);
   ```

3. **Enable debug mode:**
   ```typescript
   const client = new AgentFlowClient({
     baseUrl: '...',
     debug: true  // See full request/response
   });
   ```

---

### Problem: State not persisting across calls

```typescript
// First call
await client.invoke({
  messages: [Message.user('Remember my name is Alice')]
});

// Second call - agent doesn't remember
await client.invoke({
  messages: [Message.user('What is my name?')]
});
```

**Cause:**
Not using thread IDs to maintain conversation context.

**Solution:**

Use threads to persist state:

```typescript
const threadId = 'user_123_session_456';

// First call
await client.invoke({
  messages: [Message.user('Remember my name is Alice')],
  config: { thread_id: threadId }
});

// Second call - agent remembers
await client.invoke({
  messages: [Message.user('What is my name?')],
  config: { thread_id: threadId }
});
```

Or manage message history manually:

```typescript
const [messageHistory, setMessageHistory] = useState<Message[]>([]);

async function sendMessage(content: string) {
  const newMessage = Message.user(content);
  const allMessages = [...messageHistory, newMessage];
  
  const result = await client.invoke({
    messages: allMessages  // Include full history
  });
  
  // Update history with response
  setMessageHistory([
    ...allMessages,
    ...result.messages
  ]);
}
```

---

## Debugging Tips

### Enable Debug Mode

Always start with debug mode when troubleshooting:

```typescript
const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token',
  debug: true  // 🔍 Enable debug logging
});
```

This shows:
- Request URLs and headers
- Request payloads
- Response status codes
- Tool executions
- Errors with request IDs

---

### Use Request IDs

Every API call returns a `request_id` in metadata. Use it for debugging:

```typescript
try {
  const result = await client.invoke({ messages });
  console.log('Request ID:', result.metadata.request_id);
} catch (error) {
  // Request ID available in error for failed requests
  console.error('Failed with request ID:', error.requestId);
}
```

When reporting issues, include the request ID.

---

### Log Tool Executions

Add logging to tool handlers:

```typescript
client.registerTool({
  node: 'assistant',
  name: 'my_tool',
  handler: async (args) => {
    console.log('[TOOL] Called with:', JSON.stringify(args, null, 2));
    
    const start = Date.now();
    
    try {
      const result = await performOperation(args);
      const duration = Date.now() - start;
      
      console.log(`[TOOL] Success in ${duration}ms:`, result);
      return result;
    } catch (error) {
      console.error('[TOOL] Error:', error);
      throw error;
    }
  }
});
```

---

### Monitor Streaming

Track streaming events:

```typescript
const events: string[] = [];

for await (const chunk of client.stream({ messages })) {
  events.push(chunk.event);
  console.log(`[${chunk.event}]`, chunk.data);
}

console.log('Event sequence:', events);
// ['metadata', 'on_chain_start', 'messages_chunk', 'messages_chunk', 'on_chain_end']
```

---

### Network Inspection

Use browser DevTools or Charles Proxy to inspect:
- Request headers (auth token present?)
- Response headers (correct content-type?)
- Response body (error messages?)
- Timing (where are delays?)

---

### Test with cURL

Test API directly without the client:

```bash
# Test ping
curl http://localhost:8000/v1/ping

# Test invoke
curl -X POST http://localhost:8000/v1/graph/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": [{"type": "text", "text": "Hello"}]
      }
    ]
  }'

# Test stream
curl -N -X POST http://localhost:8000/v1/graph/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"messages": [...]}'
```

---

## FAQ

### Q: Can I use agentflow-react in Node.js (server-side)?

**A:** Yes! The library works in both browser and Node.js environments. Just ensure you have `fetch` available (Node 18+ has it built-in, or use `node-fetch` polyfill).

---

### Q: Does the library support Server-Side Rendering (SSR)?

**A:** Yes, but API calls should be made:
- Client-side with `'use client'` directive (Next.js App Router)
- In API routes (server-side)
- In `getServerSideProps` / `getStaticProps` (Next.js Pages Router)

Do not instantiate the client in SSR render functions directly.

---

### Q: How do I handle authentication in production?

**A:** Best practices:
1. Store API token in environment variables
2. Never expose tokens in client-side code
3. Use server-side API routes as proxy
4. Implement token refresh logic
5. Use secure HTTP-only cookies for user sessions

```typescript
// Next.js API route (server-side)
export async function POST(request: Request) {
  // Get user session (secure)
  const session = await getServerSession();
  
  // Create client with server-side token
  const client = new AgentFlowClient({
    baseUrl: process.env.AGENTFLOW_API_URL!,
    authToken: process.env.AGENTFLOW_API_TOKEN!
  });
  
  const result = await client.invoke(/* ... */);
  return Response.json(result);
}
```

---

### Q: Can I cancel ongoing invoke/stream operations?

**A:** 

For invoke:
```typescript
const controller = new AbortController();

setTimeout(() => controller.abort(), 5000);  // Cancel after 5s

try {
  await client.invoke({ messages }, { signal: controller.signal });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled');
  }
}
```

For stream:
```typescript
async function* streamWithCancel(messages: Message[], signal: AbortSignal) {
  for await (const chunk of client.stream({ messages })) {
    if (signal.aborted) {
      break;
    }
    yield chunk;
  }
}
```

---

### Q: How do I handle rate limiting?

**A:** Implement exponential backoff:

```typescript
async function invokeWithRetry(
  messages: Message[],
  maxRetries = 3,
  baseDelay = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.invoke({ messages });
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        // Rate limited, wait and retry
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

---

### Q: Can I use multiple agents/graphs?

**A:** Yes, just use different client instances or different `config` parameters:

```typescript
const client = new AgentFlowClient({ baseUrl: '...' });

// Agent A
const resultA = await client.invoke({
  messages: [...],
  config: { graph_id: 'agent_a' }
});

// Agent B
const resultB = await client.invoke({
  messages: [...],
  config: { graph_id: 'agent_b' }
});
```

Or separate clients:

```typescript
const clientA = new AgentFlowClient({ baseUrl: 'https://agent-a.example.com' });
const clientB = new AgentFlowClient({ baseUrl: 'https://agent-b.example.com' });
```

---

### Q: How do I test my integration?

**A:** Use testing frameworks with mocking:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { AgentFlowClient } from 'agentflow-react';

describe('Agent Integration', () => {
  it('should handle invoke', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      messages: [/* mock messages */],
      metadata: { request_id: 'test' }
    });
    
    const client = new AgentFlowClient({ baseUrl: 'http://test' });
    client.invoke = mockInvoke;
    
    const result = await client.invoke({ messages: [] });
    
    expect(mockInvoke).toHaveBeenCalled();
    expect(result.messages).toBeDefined();
  });
});
```

---

### Q: Is there a size limit for messages?

**A:** This depends on your API server configuration. Typical limits:
- Message content: 100KB per message
- Total request: 1MB
- Tool results: 50KB per result

Large data should be sent via reference (URLs) rather than inline.

---

### Q: Can tools call other tools?

**A:** No, tools can't directly call other tools. The agent decides the tool call sequence. However, tools can return data that suggests the agent call another tool:

```typescript
client.registerTool({
  node: 'assistant',
  name: 'get_user_info',
  handler: async (args) => {
    const user = await db.users.find(args.userId);
    
    return {
      user_id: user.id,
      name: user.name,
      // Suggest next action
      suggested_action: 'get_user_orders',
      suggested_params: { userId: user.id }
    };
  }
});
```

---

## Still Having Issues?

1. **Check the Examples:**
   - [Invoke Example](../examples/invoke-example.ts)
   - [Stream Example](../examples/stream-example.ts)
   - [React Examples](./react-examples.md)

2. **Enable Debug Mode:**
   ```typescript
   const client = new AgentFlowClient({
     baseUrl: '...',
     debug: true
   });
   ```

3. **Check Documentation:**
   - [Getting Started](./getting-started.md)
   - [API Reference](./api-reference.md)
   - [Tools Guide](./tools-guide.md)

4. **Search Issues:**
   Check the GitHub issues for similar problems and solutions.

5. **Ask for Help:**
   Create a new issue with:
   - Error message
   - Request ID (from metadata)
   - Minimal reproduction code
   - Expected vs actual behavior

---

**Remember:** Most issues are configuration or integration problems. Double-check:
- ✅ Auth token is correct
- ✅ Base URL is correct
- ✅ Tools registered before invoke
- ✅ Debug mode enabled
- ✅ Latest library version installed
