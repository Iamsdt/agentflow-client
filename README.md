# agentflow-react

A TypeScript library for integrating with the AgentFlow API, designed for use in React applications.

## Features

- 🚀 Full TypeScript support with comprehensive type definitions
- 🔄 Streaming API support for real-time responses
- 🛠️ Tool execution framework for remote function calling
- 🔐 Built-in authentication and timeout handling
- 🐛 Debug logging capabilities
- ✅ Comprehensive test coverage (80%+)

## Installation

```bash
npm install agentflow-react
```

## Quick Start

```typescript
import { AgentFlowClient } from 'agentflow-react';

// Initialize the client
const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-auth-token',
  timeout: 30000,
  debug: true
});

// Ping the server
const pingResponse = await client.ping();
console.log(pingResponse.data); // 'pong'

// Fetch graph information
const graphResponse = await client.graph();
console.log(graphResponse.data);

// Stream invoke
for await (const event of client.stream({
  input: { message: 'Hello' },
  config: { timeout: 300 }
})) {
  console.log(event);
}
```

## API Documentation

### Client Initialization

```typescript
const client = new AgentFlowClient({
  baseUrl: string,      // Required: API base URL
  authToken?: string,   // Optional: Authentication token
  timeout?: number,     // Optional: Request timeout in ms (default: 30000)
  debug?: boolean       // Optional: Enable debug logging (default: false)
});
```

### Available Endpoints

- **`ping()`** - Health check endpoint
- **`graph()`** - Fetch graph structure and metadata
- **`threads(options?)`** - List threads with pagination
- **`threadDetails(threadId)`** - Get thread details
- **`threadState(threadId)`** - Get thread state
- **`updateThreadState(threadId, state, config?)`** - Update thread state
- **`clearThreadState(threadId)`** - Clear thread state
- **`deleteThread(threadId)`** - Delete a thread
- **`threadMessages(threadId, options?)`** - Get thread messages
- **`threadMessage(threadId, messageId)`** - Get specific message
- **`deleteThreadMessage(threadId, messageId)`** - Delete a message
- **`addThreadMessages(threadId, messages)`** - Add messages to thread
- **`invoke(params)`** - Synchronous invoke
- **`stream(params)`** - Streaming invoke (async iterator)
- **`stateSchema()`** - Get state schema

### Tool Execution

```typescript
import { ToolExecutor, ToolDefinition } from 'agentflow-react';

// Define a tool
const weatherTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get current weather',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    }
  }
};

// Create executor with implementation
const executor = new ToolExecutor([weatherTool], {
  get_weather: async ({ location }) => {
    return `Weather in ${location}: Sunny, 72°F`;
  }
});

// Execute tool
const result = await executor.executeToolCall({
  id: 'call_1',
  type: 'function',
  function: {
    name: 'get_weather',
    arguments: '{"location":"New York"}'
  }
});
```

## Development

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

# Open coverage report in browser
npm run coverage:open

# Run tests with UI
npm run test:ui
```

### Code Coverage

This project maintains high code coverage standards:

- **Lines**: ≥ 75% (current: ~80%)
- **Functions**: ≥ 60% (current: ~60%)
- **Branches**: ≥ 75% (current: ~78%)
- **Statements**: ≥ 75% (current: ~80%)

For detailed coverage information, see:
- [Coverage Quick Guide](./README_COVERAGE.md)
- [Full Coverage Documentation](./COVERAGE.md)

Or simply run:
```bash
./check-coverage.sh
```

## Project Structure

```
src/
├── client.ts              # Main API client
├── agent.ts               # Agent types and interfaces
├── message.ts             # Message types
├── tools.ts               # Tool execution framework
├── index.ts               # Public exports
└── endpoints/             # API endpoint implementations
    ├── ping.ts
    ├── graph.ts
    ├── stream.ts
    ├── invoke.ts
    ├── threads.ts
    ├── threadState.ts
    └── ...
```

## Examples

See the `examples/` directory for detailed usage examples:

- [Stream API Usage](./examples/stream-example.ts)
- [Invoke API Usage](./examples/invoke-example.ts)
- [State Schema Examples](./examples/state-schema-examples.ts)

## Documentation

- [Quick Start Guide](./docs/QUICK_START.md)
- [Stream API Implementation](./docs/STREAM_API_IMPLEMENTATION.md)
- [State Schema Guide](./docs/state-schema-guide.md)
- [Tool Usage](./docs/invoke-usage.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass and coverage thresholds are met
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
