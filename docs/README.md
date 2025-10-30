# AgentFlow React - Documentation Index

Complete documentation for the @10xscale/agentflow-client library.

## 🚀 Getting Started

### New to AgentFlow?
**Start here for a quick introduction**

👉 **[Quick Start Guide](./QUICK_START_NEW.md)**
- Installation and setup
- Basic client configuration
- 8 common use cases with examples
- Error handling basics
- Complete working example

### Need API Reference?
**Complete reference for all endpoints**

👉 **[API Reference](./api-reference.md)**
- All 23 endpoints documented
- Request/response types
- Parameters and examples
- Error codes and handling
- Response metadata

---

## 📚 Core Guides

### Thread Management
**Managing conversation threads and messages**

👉 **[Thread API Guide](./thread-api.md)**
- Thread lifecycle and operations
- State management (get, update, clear)
- Message operations (list, add, delete)
- Use cases and best practices
- Complete examples

### Memory System
**Storing and retrieving agent memories**

👉 **[Memory API Guide](./memory-api.md)**
- Memory types (episodic, semantic, procedural, etc.)
- Core operations (store, search, update, delete)
- Retrieval strategies and distance metrics
- Use cases and best practices
- Complete examples

### Execution APIs

👉 **[Invoke Usage Guide](./invoke-usage.md)**
- Synchronous execution with tool support
- Automatic tool execution loop
- Tool registration and handlers
- Recursion limits and callbacks
- Complete examples

👉 **[Stream Usage Guide](./stream-usage.md)**
- Real-time streaming responses
- Event types and handling
- Progressive content updates
- Complete examples

👉 **[Stream Quick Reference](./stream-quick-ref.md)**
- Quick overview of streaming
- Event types at a glance
- Code snippets

### State Schema

👉 **[State Schema Guide](./state-schema-guide.md)**
- Dynamic state field discovery
- Building forms from schema
- Data validation
- Complete examples

👉 **[State Schema Quick Reference](./state-schema-quick-ref.md)**
- 30-second overview
- Quick examples
- Common use cases

---

## 🛠️ Advanced Topics

### Error Handling
**Comprehensive error handling guide**

👉 **[Error Handling Guide](./error-handling.md)**
- All error classes (400, 401, 403, 404, 422, 500+)
- Catching specific errors
- Validation error details
- Best practices
- React examples

### Implementation Details

👉 **[Invoke Implementation Summary](../IMPLEMENTATION_SUMMARY.md)**
- Technical implementation details
- Architecture and flow
- Type definitions
- Test results

👉 **[Error Handling Summary](../ERROR_HANDLING_SUMMARY.md)**
- Error system implementation
- All error codes
- Migration notes

👉 **[Stream Implementation](./STREAM_API_IMPLEMENTATION.md)**
- Streaming architecture
- Event processing
- Implementation details

---

## � Quick Navigation

| What I Want To Do | Document |
|-------------------|----------|
| **Get started quickly** | [Quick Start Guide](./QUICK_START_NEW.md) |
| **Look up an endpoint** | [API Reference](./api-reference.md) |
| **Manage conversations** | [Thread API Guide](./thread-api.md) |
| **Store/search memories** | [Memory API Guide](./memory-api.md) |
| **Execute with tools** | [Invoke Usage Guide](./invoke-usage.md) |
| **Stream responses** | [Stream Usage Guide](./stream-usage.md) |
| **Handle errors** | [Error Handling Guide](./error-handling.md) |
| **Work with state** | [State Schema Guide](./state-schema-guide.md) |
| **See code examples** | [Examples Directory](../examples/) |

---

## 📖 By API Category

### Health & Metadata
- `ping()` - Health check
- `graph()` - Graph structure
- `stateSchema()` - State schema

[See API Reference →](./api-reference.md#health--metadata)

### Thread Management (10 endpoints)
- `threads()` - List threads
- `threadDetails()` - Get thread details
- `threadState()` - Get state
- `updateThreadState()` - Update state
- `clearThreadState()` - Clear state
- `deleteThread()` - Delete thread

[See Thread API Guide →](./thread-api.md)

### Message Management (4 endpoints)
- `threadMessages()` - List messages
- `threadMessage()` - Get message
- `addThreadMessages()` - Add messages
- `deleteThreadMessage()` - Delete message

[See Thread API Guide →](./thread-api.md#message-operations)

### Execution (2 endpoints)
- `invoke()` - Synchronous execution
- `stream()` - Streaming execution

[See Invoke Guide →](./invoke-usage.md) | [See Stream Guide →](./stream-usage.md)

### Memory Management (7 endpoints)
- `storeMemory()` - Store memory
- `searchMemory()` - Search memories
- `getMemory()` - Get memory
- `updateMemory()` - Update memory
- `deleteMemory()` - Delete memory
- `listMemories()` - List memories
- `forgetMemories()` - Bulk delete

[See Memory API Guide →](./memory-api.md)

---

## 🎓 Learning Paths

### Path 1: Complete Beginner
```
1. Quick Start Guide
   ↓
2. API Reference (browse)
   ↓
3. Thread API Guide
   ↓
4. Error Handling Guide
```

### Path 2: Building Chat Application
```
1. Quick Start Guide
   ↓
2. Thread API Guide
   ↓
3. Invoke Usage Guide
   ↓
4. Memory API Guide
   ↓
5. Error Handling Guide
```

### Path 3: Advanced Agent System
```
1. Invoke Usage Guide (tools)
   ↓
2. Stream Usage Guide
   ↓
3. Memory API Guide
   ↓
4. State Schema Guide
   ↓
5. Thread API Guide
```

---

## � Code Examples

### Examples Directory
👉 **[../examples/](../examples/)**

Available examples:
- `invoke-example.ts` - Tool execution example
- `stream-example.ts` - Streaming example
- `state-schema-examples.ts` - State schema usage (6 examples)

### Quick Code Snippets

#### Basic Setup
```typescript
import { AgentFlowClient } from '@10xscale/agentflow-client';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});
```

#### Simple Invoke
```typescript
import { Message } from '@10xscale/agentflow-client';

const result = await client.invoke({
  messages: [Message.user('Hello!')]
});
```

#### Streaming
```typescript
for await (const chunk of client.stream({
  messages: [Message.user('Tell me a story')]
})) {
  if (chunk.event === 'messages_chunk') {
    process.stdout.write(chunk.data);
  }
}
```

#### Store Memory
```typescript
import { MemoryType } from '@10xscale/agentflow-client';

await client.storeMemory({
  content: 'User prefers dark mode',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences'
});
```

#### Error Handling
```typescript
import { NotFoundError, ValidationError } from '@10xscale/agentflow-client';

try {
  await client.threadDetails('thread_123');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Thread not found');
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  }
}
```

---

## 🔍 Find What You Need

### By Task

| Task | Guide |
|------|-------|
| List all threads | [Thread API](./thread-api.md#list-threads) |
| Update thread state | [Thread API](./thread-api.md#update-thread-state) |
| Add messages | [Thread API](./thread-api.md#add-messages) |
| Execute with tools | [Invoke Guide](./invoke-usage.md#tool-registration) |
| Stream responses | [Stream Guide](./stream-usage.md) |
| Store a memory | [Memory API](./memory-api.md#store-memory) |
| Search memories | [Memory API](./memory-api.md#search-memory) |
| Handle 422 errors | [Error Guide](./error-handling.md#validation-errors) |
| Get state schema | [State Schema](./state-schema-guide.md) |

### By Use Case

| Use Case | Guides |
|----------|--------|
| Chat application | [Thread API](./thread-api.md), [Error Handling](./error-handling.md) |
| Tool-using agent | [Invoke Guide](./invoke-usage.md), [API Reference](./api-reference.md) |
| Memory-enhanced bot | [Memory API](./memory-api.md), [Thread API](./thread-api.md) |
| Real-time responses | [Stream Guide](./stream-usage.md) |
| Dynamic forms | [State Schema](./state-schema-guide.md) |

---

## 📦 Library Information

### Features
- ✅ Full TypeScript support
- ✅ 23 endpoints fully documented
- ✅ Comprehensive error handling
- ✅ Streaming support
- ✅ Tool execution framework
- ✅ Memory management
- ✅ State management
- ✅ 80%+ test coverage

### Installation
```bash
npm install @10xscale/agentflow-client
```

### Version
See [package.json](../package.json) for current version

---

## 🤝 Need Help?

1. **Check the guides** - Most questions are answered in the guides above
2. **Review examples** - See working code in [examples/](../examples/)
3. **API Reference** - Look up specific endpoint details
4. **Error Handling** - Check error handling guide for common issues

---

## 📝 Documentation Status

| Topic | Status | Coverage |
|-------|--------|----------|
| Quick Start | ✅ Complete | 100% |
| API Reference | ✅ Complete | 23/23 endpoints |
| Thread API | ✅ Complete | 10 endpoints |
| Memory API | ✅ Complete | 7 endpoints |
| Invoke API | ✅ Complete | Full |
| Stream API | ✅ Complete | Full |
| State Schema | ✅ Complete | Full |
| Error Handling | ✅ Complete | All error types |
| Examples | ✅ Complete | 8+ examples |

**Last Updated:** October 26, 2025

---

## 🎓 Legacy Documentation

### State Schema (Original Docs)
1. Read: [Quick Reference](./state-schema-quick-ref.md) (5 minutes)
2. Check: Example 1 in [Examples](../examples/state-schema-examples.ts)
3. Try: `await client.graphStateSchema()`

### Level 2: Intermediate
1. Read: [Complete Guide](./state-schema-guide.md) (15 minutes)
2. Try: Examples 2-3 (forms and validation)
3. Implement: Simple form generation

### Level 3: Advanced
1. Read: [Direction Change](./DIRECTION_CHANGE.md) (10 minutes)
2. Read: [Implementation Details](./state-schema-implementation.md) (10 minutes)
3. Try: Examples 5-6 (type generation, docs generation)
4. Extend: Build custom use cases

## 🔍 Find What You Need

### I want to...

**...understand what the API does**
→ [Quick Reference](./state-schema-quick-ref.md) - "What is it?" section

**...build a form**
→ [Complete Guide](./state-schema-guide.md) - "Use Cases" > "Build a Dynamic Form"
→ [Examples](../examples/state-schema-examples.ts) - Example 2

**...validate data**
→ [Complete Guide](./state-schema-guide.md) - "Use Cases" > "Validate Data Before Sending"
→ [Examples](../examples/state-schema-examples.ts) - Example 3

**...generate TypeScript types**
→ [Examples](../examples/state-schema-examples.ts) - Example 5

**...understand the design decisions**
→ [Direction Change](./DIRECTION_CHANGE.md)

**...see the implementation**
→ [Implementation Summary](./state-schema-implementation.md)

**...check error handling**
→ [Complete Guide](./state-schema-guide.md) - "Error Handling"
→ [Quick Reference](./state-schema-quick-ref.md) - "Error Handling"

**...understand core vs dynamic fields**
→ [Complete Guide](./state-schema-guide.md) - "Dynamic Fields"
→ [Examples](../examples/state-schema-examples.ts) - Example 4

## 📊 What You'll Learn

After reading these docs, you'll understand:

✅ What the State Schema API returns
✅ How to iterate through field definitions
✅ How to build forms automatically
✅ How to validate data using the schema
✅ How to generate TypeScript types
✅ How to handle errors
✅ The design decisions behind the API
✅ How to use dynamic/custom fields

## 🚀 Quick Start Code

```typescript
import { AgentFlowClient } from '@10xscale/agentflow-client';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});

// Get the schema
const response = await client.graphStateSchema();
const schema = response.data;

// Explore fields
Object.entries(schema.properties).forEach(([name, field]) => {
  console.log(`${name}: ${field.type}`);
  if (field.description) console.log(`  ${field.description}`);
  if (field.default !== undefined) console.log(`  Default: ${field.default}`);
});
```

## 📞 Support

Having issues? Check:
1. [Error Handling](./state-schema-quick-ref.md#error-handling) section
2. [Quick Reference](./state-schema-quick-ref.md)
3. [Examples](../examples/state-schema-examples.ts)
4. [Implementation Details](./state-schema-implementation.md)

## 📈 Documentation Stats

- 📄 4 markdown guides (50+ KB of documentation)
- 💻 1 example file with 6 complete examples (500+ lines of code)
- ✅ 26/26 tests passing
- 🎯 Self-documenting API with full type definitions

## 🎯 Key Takeaways

1. **Schema First**: API returns schema definitions, not data
2. **Self-Documenting**: Fields include descriptions, types, defaults
3. **Extensible**: Supports dynamic fields from server configuration
4. **Type-Safe**: Full TypeScript support with generated types
5. **Developer-Friendly**: Build forms, validation, docs automatically

---

**Last Updated**: October 19, 2025
**Status**: ✅ Production Ready
**Tests**: 26/26 Passing
**TypeScript**: ✅ All types defined
