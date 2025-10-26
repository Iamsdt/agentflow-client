# agentflow-react

A TypeScript library for integrating with the AgentFlow API, designed for building conversational AI applications with memory, state management, and tool execution capabilities.

## ✨ Features

- 🚀 **Full TypeScript Support** - Complete type definitions for all 23 endpoints
- 🔄 **Streaming API** - Real-time responses with Server-Sent Events
- 🛠️ **Tool Execution** - Automatic local tool execution with remote agents
- 💾 **Memory Management** - Vector-based semantic memory storage and retrieval
- 🎯 **Thread Management** - Organize conversations with persistent state
- 🔐 **Built-in Auth** - Token-based authentication with timeout handling
- � **State Schema** - Dynamic state discovery and validation
- ⚠️ **Rich Error Handling** - Structured errors with request IDs for debugging
- ✅ **Well Tested** - 80%+ code coverage with 296+ passing tests

## 📦 Installation

```bash
npm install agentflow-react
```

Or with yarn:

```bash
yarn add agentflow-react
```

## 🚀 Quick Start

### Basic Setup

```typescript
import { AgentFlowClient, Message } from 'agentflow-react';

const client = new AgentFlowClient({
  baseUrl: 'https://your-api-url.com',
  authToken: 'your-auth-token',
  timeout: 60000,  // 60 seconds
  debug: true      // Enable debug logging
});

// Health check
await client.ping();
```

### Simple Conversation

```typescript
// Execute agent synchronously
const result = await client.invoke({
  messages: [
    Message.user("What's the weather like today?")
  ],
  granularity: 'full'
});

console.log(result.messages);
```

### Streaming Responses

```typescript
// Get real-time responses
for await (const chunk of client.stream({
  messages: [
    Message.user('Tell me a story about a robot')
  ]
})) {
  if (chunk.event === 'messages_chunk') {
    process.stdout.write(chunk.data);
  }
}
```

### Tool Execution

```typescript
// Register tools
client.registerTool({
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
    return { temp: 72, condition: 'sunny' };
  }
});

// Tools execute automatically during invoke
const result = await client.invoke({
  messages: [Message.user("What's the weather in NYC?")]
});
```

### Memory Operations

```typescript
import { MemoryType } from 'agentflow-react';

// Store memory
await client.storeMemory({
  content: 'User prefers dark mode',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences'
});

// Search memories
const results = await client.searchMemory({
  query: 'user interface preferences',
  limit: 5
});
```

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](./docs/QUICK_START_NEW.md)** - Get up and running in minutes
- **[API Reference](./docs/api-reference.md)** - Complete reference for all 23 endpoints

### Core Guides
- **[Thread API Guide](./docs/thread-api.md)** - Managing conversations and messages
- **[Memory API Guide](./docs/memory-api.md)** - Storing and retrieving memories
- **[Invoke Usage Guide](./docs/invoke-usage.md)** - Synchronous execution with tools
- **[Stream Usage Guide](./docs/stream-usage.md)** - Real-time streaming responses
- **[State Schema Guide](./docs/state-schema-guide.md)** - Dynamic state management
- **[Error Handling Guide](./docs/error-handling.md)** - Comprehensive error handling

### Code Examples

**Inline in Documentation:**
All guides include practical, copy-paste ready code examples:
- **[Memory API Guide](./docs/memory-api.md)** - 7 complete use cases with code
- **[Thread API Guide](./docs/thread-api.md)** - 4 complete use cases with code  
- **[Error Handling Guide](./docs/error-handling.md)** - Multiple error handling patterns
- **[Quick Start Guide](./docs/QUICK_START_NEW.md)** - 8 common scenarios

**Standalone Example Files:**
- **[examples/invoke-example.ts](./examples/invoke-example.ts)** - Tool execution
- **[examples/stream-example.ts](./examples/stream-example.ts)** - Streaming
- **[examples/state-schema-examples.ts](./examples/state-schema-examples.ts)** - State schema (6 examples)

## 🔌 API Overview

### Thread Management (10 endpoints)
Organize conversations by user, session, or topic:
- `threads()` - List all threads
- `threadDetails()` - Get thread information
- `threadState()` - Get thread state
- `updateThreadState()` - Update state values
- `clearThreadState()` - Clear all state
- `deleteThread()` - Delete thread
- `threadMessages()` - List messages
- `threadMessage()` - Get single message
- `addThreadMessages()` - Add messages
- `deleteThreadMessage()` - Delete message

### Memory Management (7 endpoints)
Store and retrieve agent memories:
- `storeMemory()` - Store new memory
- `searchMemory()` - Search with vector similarity
- `getMemory()` - Get by ID
- `updateMemory()` - Update memory
- `deleteMemory()` - Delete memory
- `listMemories()` - List all memories
- `forgetMemories()` - Bulk delete

### Execution (2 endpoints)
Execute agent workflows:
- `invoke()` - Synchronous execution with automatic tool loop
- `stream()` - Real-time streaming responses

### Metadata (3 endpoints)
Get graph and schema information:
- `ping()` - Health check
- `graph()` - Graph structure
- `stateSchema()` - State schema definition

## 🎯 Use Cases

### Chat Application
```typescript
// Initialize thread
const threadId = 'thread_user_123';

await client.updateThreadState(threadId, {
  state: { user_id: 'user_123', created_at: new Date().toISOString() }
});

// Add user message
await client.addThreadMessages(threadId, {
  messages: [Message.user('Hello!')]
});

// Execute agent
const result = await client.invoke({
  messages: [Message.user('Hello!')],
  config: { thread_id: threadId }
});
```

### Memory-Enhanced Bot
```typescript
import { MemoryType, RetrievalStrategy } from 'agentflow-react';

// Store conversation memory
await client.storeMemory({
  content: 'User asked about pricing plans',
  memory_type: MemoryType.EPISODIC,
  category: 'conversation',
  metadata: { user_id: 'user_123' }
});

// Retrieve relevant context
const context = await client.searchMemory({
  query: 'previous pricing discussions',
  memory_type: MemoryType.EPISODIC,
  retrieval_strategy: RetrievalStrategy.HYBRID,
  limit: 10
});

// Use context in conversation
const result = await client.invoke({
  messages: [
    Message.system(`Context: ${JSON.stringify(context.data.results)}`),
    Message.user('What pricing plans do you offer?')
  ]
});
```

### Tool-Using Agent
```typescript
// Register multiple tools
client.registerTool({
  node: 'calculator',
  name: 'calculate',
  description: 'Perform calculations',
  parameters: { /* ... */ },
  handler: async (args) => ({ result: eval(args.expression) })
});

client.registerTool({
  node: 'database',
  name: 'search_db',
  description: 'Search database',
  parameters: { /* ... */ },
  handler: async (args) => await db.search(args.query)
});

// Agent automatically uses tools
const result = await client.invoke({
  messages: [Message.user('Search for users and calculate total revenue')],
  recursion_limit: 10
});

console.log(`Used ${result.iterations} iterations`);
```

## ⚠️ Error Handling

```typescript
import {
  AgentFlowError,
  NotFoundError,
  ValidationError,
  AuthenticationError
} from 'agentflow-react';

try {
  await client.threadDetails('thread_123');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Please log in again');
  } else if (error instanceof NotFoundError) {
    console.log('Thread not found');
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.details);
  } else if (error instanceof AgentFlowError) {
    console.log('Error:', error.message);
    console.log('Request ID:', error.requestId);  // For support
  }
}
```

**Error Classes:**
- `BadRequestError` (400)
- `AuthenticationError` (401)
- `PermissionError` (403)
- `NotFoundError` (404)
- `ValidationError` (422) - with field-level details
- `ServerError` (500+)

See [Error Handling Guide](./docs/error-handling.md) for complete details.

## 🧪 Development

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in watch mode
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run coverage

# Open coverage report
npm run coverage:open
```

### Code Quality

This project maintains high standards:
- ✅ **296+ tests** passing
- ✅ **80%+ code coverage** (lines, statements, branches)
- ✅ **Full TypeScript** strict mode
- ✅ **Zero compilation errors**

## 📁 Project Structure

```
agentflow-react/
├── src/
│   ├── client.ts              # Main API client
│   ├── agent.ts               # Agent types
│   ├── message.ts             # Message builders
│   ├── tools.ts               # Tool execution
│   ├── errors.ts              # Error classes
│   ├── index.ts               # Public exports
│   └── endpoints/             # 23 endpoint implementations
│       ├── ping.ts
│       ├── graph.ts
│       ├── invoke.ts
│       ├── stream.ts
│       ├── threads.ts
│       ├── threadState.ts
│       ├── threadMessages.ts
│       ├── storeMemory.ts
│       ├── searchMemory.ts
│       └── ...
├── tests/                     # 296+ tests
├── examples/                  # Usage examples
├── docs/                      # Comprehensive documentation
│   ├── api-reference.md
│   ├── thread-api.md
│   ├── memory-api.md
│   ├── invoke-usage.md
│   ├── stream-usage.md
│   ├── state-schema-guide.md
│   ├── error-handling.md
│   └── QUICK_START_NEW.md
└── README.md                  # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📊 Stats

- **Lines of Code**: ~8,000
- **Test Files**: 25+
- **Tests**: 296+
- **Coverage**: 80%+
- **Endpoints**: 23
- **Documentation**: 10+ guides

## 📄 License

MIT

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Examples**: [examples/](./examples/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/agentflow-react/issues)

## 🙏 Acknowledgments

Built with ❤️ using:
- TypeScript
- Vite
- Vitest

---

**[Get Started →](./docs/QUICK_START_NEW.md)** | **[API Reference →](./docs/api-reference.md)** | **[Examples →](./examples/)**
