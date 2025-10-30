# Tools Guide

Complete guide to tool registration, execution, and best practices in agentflow-react.

## Table of Contents

- [What Are Tools?](#what-are-tools)
- [When to Use Tools](#when-to-use-tools)
- [Tool Registration](#tool-registration)
- [Tool Parameters](#tool-parameters)
- [Tool Execution Flow](#tool-execution-flow)
- [Error Handling](#error-handling)
- [Common Tool Patterns](#common-tool-patterns)
- [Advanced Topics](#advanced-topics)
- [Testing Tools](#testing-tools)
- [Best Practices](#best-practices)

---

## What Are Tools?

**Tools** are functions that your agent can call to perform actions or retrieve information. They extend the agent's capabilities beyond text generation, enabling it to:

- 🌤️ Fetch real-time data (weather, stock prices, news)
- 🔢 Perform calculations
- 💾 Query databases
- 📁 Read/write files
- 🌐 Call external APIs
- 🔍 Search knowledge bases
- ✉️ Send emails or notifications
- 🤖 Control external systems

### How Tools Work

1. **Agent decides** to use a tool based on user input
2. **API returns** a `remote_tool_call` block with function name and arguments
3. **Client executes** the tool locally using your registered handler
4. **Client sends** the tool result back to the API
5. **Agent processes** the result and continues the conversation

**Key Concept:** Tools run **on the client side**, not on the server. This gives you full control over what actions the agent can perform and keeps sensitive operations secure.

---

## When to Use Tools

### ✅ Use Tools When You Need To:

- **Access real-time data** that the agent doesn't have (weather, prices, dates)
- **Perform calculations** beyond the agent's capabilities
- **Interact with external systems** (databases, APIs, file systems)
- **Execute custom business logic** specific to your application
- **Maintain security** by keeping sensitive operations on your infrastructure
- **Enforce access control** based on user permissions

### ❌ Don't Use Tools For:

- **Simple text responses** the agent can generate directly
- **Static knowledge** the agent already knows
- **Complex reasoning** the agent can do without external help
- **Actions that should be server-side** (better done in the agent graph)

### Example Decision Tree

```
User: "What's the weather in Paris?"
  └─> ✅ USE TOOL: Need real-time data

User: "Explain how weather works"
  └─> ❌ NO TOOL: Agent can explain directly

User: "Calculate 5432 * 8976"
  └─> ✅ USE TOOL: Precise calculation needed

User: "What's roughly 5000 times 9000?"
  └─> ❌ NO TOOL: Agent can estimate

User: "Save this to my database"
  └─> ✅ USE TOOL: External system interaction
```

---

## Tool Registration

### Basic Registration

Register tools with the `registerTool()` method before calling `invoke()` or `stream()`:

```typescript
import { AgentFlowClient } from 'agentflow-react';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});

client.registerTool({
  node: 'my_agent_node',           // Node name from your agent graph
  name: 'get_current_time',        // Unique function name
  description: 'Get the current time in a specific timezone',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone (e.g., America/New_York)'
      }
    },
    required: ['timezone']
  },
  handler: async (args) => {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: args.timezone,
      dateStyle: 'full',
      timeStyle: 'long'
    });
    return { time: formatter.format(date) };
  }
});
```

### Multiple Tools

Register as many tools as needed:

```typescript
// Tool 1: Weather
client.registerTool({
  node: 'assistant_node',
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name or ZIP code' }
    },
    required: ['location']
  },
  handler: async (args) => {
    const weather = await fetchWeatherAPI(args.location);
    return { temp: weather.temp, condition: weather.condition };
  }
});

// Tool 2: Calculator
client.registerTool({
  node: 'assistant_node',
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: { 
        type: 'string', 
        description: 'Math expression (e.g., "2 + 2" or "sqrt(16)")'
      }
    },
    required: ['expression']
  },
  handler: async (args) => {
    // Use a safe math parser in production
    const result = evaluateMathExpression(args.expression);
    return { result };
  }
});

// Tool 3: Database Query
client.registerTool({
  node: 'assistant_node',
  name: 'search_products',
  description: 'Search product database',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', description: 'Max results', default: 10 }
    },
    required: ['query']
  },
  handler: async (args) => {
    const products = await db.products.search(args.query, args.limit);
    return { products };
  }
});
```

### Tool Registration Object

```typescript
interface ToolRegistration {
  node: string;              // Node name from your agent graph (required)
  name: string;              // Unique function name (required)
  description?: string;      // What the tool does (helps agent decide when to use it)
  parameters?: {             // OpenAI-compatible parameter schema
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler: (args: any) => Promise<any>;  // Async function that executes the tool
}
```

---

## Tool Parameters

Tool parameters use the **OpenAI function-calling schema** (JSON Schema format).

### Parameter Schema Structure

```typescript
parameters: {
  type: 'object',              // Always 'object' for tool parameters
  properties: {
    // Define each parameter here
    parameterName: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object',
      description: 'What this parameter is for',
      // ... additional validation rules
    }
  },
  required: ['param1', 'param2']  // List of required parameters
}
```

### Parameter Types

#### String Parameters

```typescript
location: {
  type: 'string',
  description: 'City name or ZIP code',
  enum: ['New York', 'London', 'Tokyo'],  // Optional: restrict to specific values
  pattern: '^[0-9]{5}$'                    // Optional: regex pattern
}
```

#### Number Parameters

```typescript
temperature: {
  type: 'number',
  description: 'Temperature in Celsius',
  minimum: -273.15,       // Optional: minimum value
  maximum: 100,           // Optional: maximum value
  default: 20             // Optional: default value
}
```

#### Boolean Parameters

```typescript
includeDetails: {
  type: 'boolean',
  description: 'Include detailed information',
  default: false
}
```

#### Array Parameters

```typescript
tags: {
  type: 'array',
  description: 'List of tags to filter by',
  items: {
    type: 'string'        // Type of array elements
  },
  minItems: 1,            // Optional: minimum array length
  maxItems: 10            // Optional: maximum array length
}
```

#### Object Parameters

```typescript
filters: {
  type: 'object',
  description: 'Search filters',
  properties: {
    category: { type: 'string' },
    minPrice: { type: 'number' },
    maxPrice: { type: 'number' }
  },
  required: ['category']
}
```

### Complete Example

```typescript
client.registerTool({
  node: 'search_node',
  name: 'advanced_search',
  description: 'Search with filters and options',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      filters: {
        type: 'object',
        description: 'Search filters',
        properties: {
          category: { 
            type: 'string',
            enum: ['electronics', 'books', 'clothing']
          },
          minPrice: { type: 'number', minimum: 0 },
          maxPrice: { type: 'number', minimum: 0 },
          inStock: { type: 'boolean', default: true }
        }
      },
      sort: {
        type: 'string',
        enum: ['relevance', 'price_asc', 'price_desc', 'rating'],
        default: 'relevance'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 20
      }
    },
    required: ['query']
  },
  handler: async (args) => {
    // Implementation
    return await searchWithFilters(args);
  }
});
```

---

## Tool Execution Flow

### Automatic Tool Loop (invoke)

When using `invoke()`, the client automatically handles the tool execution loop:

```typescript
const result = await client.invoke({
  messages: [Message.user("What's the weather in Tokyo?")],
  recursion_limit: 10  // Max tool execution iterations
});

// Behind the scenes:
// 1. Client sends message to API
// 2. API returns: "I need to call get_weather tool"
// 3. Client executes get_weather('Tokyo') locally
// 4. Client sends tool result back to API
// 5. API processes result and generates response
// 6. Client returns final response to you
```

**Flow Diagram:**

```
User Input
    ↓
API Request
    ↓
API Response (with remote_tool_call)
    ↓
Execute Tool Locally ← Your handler runs here
    ↓
Send Tool Result
    ↓
API Processes Result
    ↓
Final Response
```

### Manual Tool Loop (stream)

With `stream()`, you're responsible for the tool loop:

```typescript
import { Message } from 'agentflow-react';

let messages = [Message.user("What's the weather in Tokyo?")];
let continueLoop = true;
let iterations = 0;
const maxIterations = 10;

while (continueLoop && iterations < maxIterations) {
  continueLoop = false;
  const collectedMessages: Message[] = [];
  
  // Stream the response
  for await (const chunk of client.stream({ messages })) {
    if (chunk.event === 'messages_chunk') {
      // Collect message chunks
      // ... (accumulate messages)
    }
  }
  
  // Check for tool calls
  const toolCalls = extractToolCalls(collectedMessages);
  
  if (toolCalls.length > 0) {
    // Execute tools
    const toolResults = await executeTools(toolCalls);
    
    // Add results to messages
    messages = [...messages, ...collectedMessages, ...toolResults];
    
    // Continue the loop
    continueLoop = true;
    iterations++;
  }
}
```

**See:** [Stream Usage Guide](./stream-usage.md) for complete streaming examples.

### Recursion Limit

The `recursion_limit` parameter prevents infinite tool loops:

```typescript
const result = await client.invoke({
  messages: [Message.user("Keep calculating until you reach 1000")],
  recursion_limit: 25  // Stop after 25 iterations (default)
});

if (result.recursion_limit_reached) {
  console.log('Tool loop stopped: recursion limit reached');
  console.log(`Completed ${result.iterations} iterations`);
}
```

---

## Error Handling

### Tool Handler Errors

When a tool handler throws an error, it's sent back to the agent as a tool failure:

```typescript
client.registerTool({
  node: 'assistant',
  name: 'divide',
  description: 'Divide two numbers',
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  },
  handler: async (args) => {
    if (args.b === 0) {
      throw new Error('Cannot divide by zero');
    }
    return { result: args.a / args.b };
  }
});

// When called with divide(10, 0):
// Agent receives: { error: "Cannot divide by zero", is_error: true }
// Agent can then respond: "I can't divide by zero. Please provide a non-zero divisor."
```

### Graceful Error Handling

Return error objects instead of throwing:

```typescript
client.registerTool({
  node: 'assistant',
  name: 'fetch_user',
  description: 'Get user information',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string' }
    },
    required: ['userId']
  },
  handler: async (args) => {
    try {
      const user = await db.users.findById(args.userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          userId: args.userId
        };
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});
```

### Validation Errors

Validate parameters in your handler:

```typescript
client.registerTool({
  node: 'assistant',
  name: 'send_email',
  description: 'Send an email',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Email address' },
      subject: { type: 'string' },
      body: { type: 'string' }
    },
    required: ['to', 'subject', 'body']
  },
  handler: async (args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.to)) {
      throw new Error(`Invalid email address: ${args.to}`);
    }
    
    // Validate length
    if (args.body.length > 10000) {
      throw new Error('Email body too long (max 10,000 characters)');
    }
    
    // Send email
    await emailService.send(args.to, args.subject, args.body);
    
    return { success: true, sent_at: new Date().toISOString() };
  }
});
```

---

## Common Tool Patterns

### 1. Weather API Tool

```typescript
import axios from 'axios';

client.registerTool({
  node: 'assistant',
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates'
      },
      units: {
        type: 'string',
        enum: ['metric', 'imperial'],
        default: 'metric'
      }
    },
    required: ['location']
  },
  handler: async (args) => {
    const apiKey = process.env.WEATHER_API_KEY;
    const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
      params: {
        key: apiKey,
        q: args.location
      }
    });
    
    return {
      location: response.data.location.name,
      temperature: response.data.current.temp_c,
      condition: response.data.current.condition.text,
      humidity: response.data.current.humidity,
      wind_kph: response.data.current.wind_kph
    };
  }
});
```

### 2. Calculator Tool

```typescript
import { evaluate } from 'mathjs';  // Safe math evaluation library

client.registerTool({
  node: 'assistant',
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Math expression (e.g., "sqrt(144)", "2 * pi * 5")'
      }
    },
    required: ['expression']
  },
  handler: async (args) => {
    try {
      const result = evaluate(args.expression);
      return {
        expression: args.expression,
        result: result,
        formatted: `${args.expression} = ${result}`
      };
    } catch (error) {
      throw new Error(`Invalid expression: ${args.expression}`);
    }
  }
});
```

### 3. Database Query Tool

```typescript
import { db } from './database';

client.registerTool({
  node: 'assistant',
  name: 'search_products',
  description: 'Search for products in the database',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      category: { 
        type: 'string',
        enum: ['electronics', 'clothing', 'books', 'all'],
        default: 'all'
      },
      limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
    },
    required: ['query']
  },
  handler: async (args) => {
    let query = db.products.where('name', 'like', `%${args.query}%`);
    
    if (args.category !== 'all') {
      query = query.where('category', '=', args.category);
    }
    
    const products = await query.limit(args.limit).get();
    
    return {
      query: args.query,
      count: products.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        in_stock: p.stock > 0
      }))
    };
  }
});
```

### 4. File Operations Tool

```typescript
import fs from 'fs/promises';
import path from 'path';

client.registerTool({
  node: 'assistant',
  name: 'read_file',
  description: 'Read contents of a file',
  parameters: {
    type: 'object',
    properties: {
      filepath: {
        type: 'string',
        description: 'Path to the file (relative to allowed directory)'
      }
    },
    required: ['filepath']
  },
  handler: async (args) => {
    // Security: only allow reading from specific directory
    const allowedDir = path.resolve('./data');
    const requestedPath = path.resolve(allowedDir, args.filepath);
    
    if (!requestedPath.startsWith(allowedDir)) {
      throw new Error('Access denied: file outside allowed directory');
    }
    
    try {
      const content = await fs.readFile(requestedPath, 'utf-8');
      return {
        filepath: args.filepath,
        content: content,
        size: content.length
      };
    } catch (error) {
      throw new Error(`Could not read file: ${error.message}`);
    }
  }
});
```

### 5. External API Tool

```typescript
import axios from 'axios';

client.registerTool({
  node: 'assistant',
  name: 'search_web',
  description: 'Search the web using a search API',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      num_results: { type: 'number', minimum: 1, maximum: 10, default: 5 }
    },
    required: ['query']
  },
  handler: async (args) => {
    const apiKey = process.env.SEARCH_API_KEY;
    
    const response = await axios.get('https://api.search.example.com/search', {
      params: {
        q: args.query,
        n: args.num_results,
        key: apiKey
      },
      timeout: 10000  // 10 second timeout
    });
    
    return {
      query: args.query,
      results: response.data.results.map((r: any) => ({
        title: r.title,
        snippet: r.snippet,
        url: r.url
      }))
    };
  }
});
```

### 6. Authentication-Aware Tool

```typescript
client.registerTool({
  node: 'assistant',
  name: 'get_user_orders',
  description: 'Get orders for the authenticated user',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'pending', 'shipped', 'delivered'],
        default: 'all'
      },
      limit: { type: 'number', default: 10 }
    }
  },
  handler: async (args, context) => {
    // Get user ID from context (passed from your application)
    const userId = context.userId;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    let query = db.orders.where('user_id', '=', userId);
    
    if (args.status !== 'all') {
      query = query.where('status', '=', args.status);
    }
    
    const orders = await query.limit(args.limit).get();
    
    return {
      user_id: userId,
      count: orders.length,
      orders: orders.map(o => ({
        id: o.id,
        total: o.total,
        status: o.status,
        created_at: o.created_at
      }))
    };
  }
});
```

---

## Advanced Topics

### Async Tools

All tool handlers are async by default:

```typescript
client.registerTool({
  node: 'assistant',
  name: 'fetch_data',
  handler: async (args) => {
    // Multiple async operations
    const [weather, stocks, news] = await Promise.all([
      fetchWeather(args.location),
      fetchStocks(args.symbols),
      fetchNews(args.topic)
    ]);
    
    return { weather, stocks, news };
  }
});
```

### Tool Composition

Break complex tools into smaller functions:

```typescript
// Helper functions
async function validateUser(userId: string) {
  const user = await db.users.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
}

async function checkPermissions(user: any, resource: string) {
  if (!user.permissions.includes(resource)) {
    throw new Error('Permission denied');
  }
}

async function performAction(user: any, action: string) {
  // ... implementation
}

// Composed tool
client.registerTool({
  node: 'assistant',
  name: 'user_action',
  handler: async (args) => {
    const user = await validateUser(args.userId);
    await checkPermissions(user, args.resource);
    return await performAction(user, args.action);
  }
});
```

### Dynamic Tool Registration

Register tools conditionally based on user or environment:

```typescript
function registerUserTools(client: AgentFlowClient, user: User) {
  // Basic tools for all users
  client.registerTool({
    node: 'assistant',
    name: 'get_profile',
    handler: async () => {
      return { name: user.name, email: user.email };
    }
  });
  
  // Admin-only tools
  if (user.isAdmin) {
    client.registerTool({
      node: 'assistant',
      name: 'list_all_users',
      handler: async () => {
        return await db.users.all();
      }
    });
  }
  
  // Premium user tools
  if (user.isPremium) {
    client.registerTool({
      node: 'assistant',
      name: 'advanced_analytics',
      handler: async () => {
        return await analytics.getAdvancedMetrics(user.id);
      }
    });
  }
}
```

### Stateful Tools

Maintain state across tool calls using closures:

```typescript
function createSessionTools(sessionId: string) {
  const sessionData = new Map<string, any>();
  
  return [
    {
      node: 'assistant',
      name: 'store_session_data',
      handler: async (args: { key: string; value: any }) => {
        sessionData.set(args.key, args.value);
        return { success: true, key: args.key };
      }
    },
    {
      node: 'assistant',
      name: 'get_session_data',
      handler: async (args: { key: string }) => {
        const value = sessionData.get(args.key);
        return { key: args.key, value, exists: value !== undefined };
      }
    }
  ];
}

// Register session tools
const tools = createSessionTools('session_123');
tools.forEach(tool => client.registerTool(tool));
```

### Caching & Performance

Cache expensive operations:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });  // 5 minute cache

client.registerTool({
  node: 'assistant',
  name: 'get_exchange_rate',
  handler: async (args) => {
    const cacheKey = `rate_${args.from}_${args.to}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }
    
    // Fetch fresh data
    const rate = await fetchExchangeRate(args.from, args.to);
    
    // Cache the result
    cache.set(cacheKey, rate);
    
    return { ...rate, cached: false };
  }
});
```

---

## Testing Tools

### Unit Testing Tool Handlers

Test your tool handlers independently:

```typescript
import { describe, it, expect } from 'vitest';

describe('Calculator Tool', () => {
  const handler = async (args: any) => {
    // Your calculator handler implementation
    const result = evaluate(args.expression);
    return { result };
  };
  
  it('should calculate basic arithmetic', async () => {
    const result = await handler({ expression: '2 + 2' });
    expect(result.result).toBe(4);
  });
  
  it('should handle complex expressions', async () => {
    const result = await handler({ expression: 'sqrt(144) * 2' });
    expect(result.result).toBe(24);
  });
  
  it('should throw error for invalid expressions', async () => {
    await expect(handler({ expression: 'invalid' }))
      .rejects
      .toThrow('Invalid expression');
  });
});
```

### Integration Testing

Test tools with the agent:

```typescript
import { AgentFlowClient, Message } from 'agentflow-react';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Weather Tool Integration', () => {
  let client: AgentFlowClient;
  
  beforeEach(() => {
    client = new AgentFlowClient({
      baseUrl: 'http://localhost:8000',
      authToken: 'test-token'
    });
    
    // Register test weather tool
    client.registerTool({
      node: 'assistant',
      name: 'get_weather',
      handler: async (args) => {
        // Mock weather data for testing
        return {
          location: args.location,
          temperature: 72,
          condition: 'sunny'
        };
      }
    });
  });
  
  it('should execute weather tool when asked', async () => {
    const result = await client.invoke({
      messages: [Message.user("What's the weather in Paris?")]
    });
    
    // Verify tool was executed
    expect(result.iterations).toBeGreaterThan(0);
    
    // Verify response mentions weather data
    const response = result.messages[0].content;
    expect(response).toContain('72');
    expect(response).toContain('sunny');
  });
});
```

### Mock Tools for Testing

Create mock tools for testing without external dependencies:

```typescript
function createMockTools(client: AgentFlowClient) {
  client.registerTool({
    node: 'assistant',
    name: 'get_weather',
    handler: async (args) => ({
      location: args.location,
      temperature: 72,
      condition: 'sunny'
    })
  });
  
  client.registerTool({
    node: 'assistant',
    name: 'search_products',
    handler: async (args) => ({
      products: [
        { id: 1, name: 'Test Product', price: 29.99 }
      ]
    })
  });
  
  client.registerTool({
    node: 'assistant',
    name: 'send_email',
    handler: async (args) => ({
      success: true,
      message_id: 'mock_message_123'
    })
  });
}
```

---

## Best Practices

### ✅ DO:

1. **Use descriptive names and descriptions**
   - Good: `get_current_weather`, `calculate_loan_payment`
   - Bad: `tool1`, `function_a`

2. **Return structured data**
   ```typescript
   // Good
   return {
     success: true,
     data: { temp: 72, condition: 'sunny' },
     timestamp: new Date().toISOString()
   };
   
   // Bad
   return "The temperature is 72 and it's sunny";
   ```

3. **Validate inputs**
   ```typescript
   if (!args.email || !emailRegex.test(args.email)) {
     throw new Error('Invalid email address');
   }
   ```

4. **Handle errors gracefully**
   ```typescript
   try {
     return await externalAPI.call(args);
   } catch (error) {
     return {
       success: false,
       error: error.message,
       fallback_data: getCachedData()
     };
   }
   ```

5. **Use async/await consistently**
   ```typescript
   handler: async (args) => {
     const result = await fetchData(args);
     return result;
   }
   ```

6. **Keep tools focused (single responsibility)**
   - One tool = one clear purpose
   - Split complex operations into multiple tools

7. **Add timeout protection**
   ```typescript
   handler: async (args) => {
     const controller = new AbortController();
     const timeout = setTimeout(() => controller.abort(), 5000);
     
     try {
       const result = await fetch(url, { signal: controller.signal });
       return result;
     } finally {
       clearTimeout(timeout);
     }
   }
   ```

### ❌ DON'T:

1. **Don't use eval() for calculations**
   - Use a safe math library like mathjs
   
2. **Don't expose sensitive data**
   ```typescript
   // Bad
   return { user: fullUserObject };  // Might include passwords, tokens
   
   // Good
   return { 
     user: { 
       id: user.id, 
       name: user.name, 
       email: user.email 
     } 
   };
   ```

3. **Don't perform blocking operations**
   ```typescript
   // Bad
   handler: (args) => {
     // Synchronous blocking operation
     return fs.readFileSync(args.path);
   };
   
   // Good
   handler: async (args) => {
     return await fs.promises.readFile(args.path, 'utf-8');
   };
   ```

4. **Don't ignore errors**
   ```typescript
   // Bad
   try {
     await riskyOperation();
   } catch (e) {
     // Silent failure
   }
   
   // Good
   try {
     await riskyOperation();
   } catch (e) {
     console.error('Operation failed:', e);
     throw new Error('Could not complete operation');
   }
   ```

5. **Don't use tools for simple data the agent knows**
   - Let the agent handle general knowledge
   - Only use tools for external/dynamic data

### Security Best Practices

1. **Validate and sanitize all inputs**
2. **Use allowlists, not denylists** for file paths and resources
3. **Never execute arbitrary code** from tool arguments
4. **Implement rate limiting** for expensive operations
5. **Use environment variables** for API keys and secrets
6. **Check permissions** before performing actions
7. **Audit tool usage** in production
8. **Timeout protection** on all external calls

### Performance Best Practices

1. **Cache frequently requested data**
2. **Use connection pooling** for database tools
3. **Batch operations** when possible
4. **Add timeouts** to all external calls
5. **Monitor tool execution time**
6. **Consider async execution** for slow operations
7. **Limit recursion depth** appropriately

---

## Summary

- ✅ Tools extend your agent's capabilities with real-world actions
- ✅ Register tools with `client.registerTool()` before invoking
- ✅ Use OpenAI-compatible parameter schemas
- ✅ Handlers are async and can call any JavaScript/TypeScript code
- ✅ `invoke()` handles the tool loop automatically
- ✅ `stream()` requires manual tool loop handling
- ✅ Return structured data, not strings
- ✅ Handle errors gracefully with try/catch
- ✅ Test tools independently and with the agent
- ✅ Follow security and performance best practices

---

## See Also

- [API Reference](./api-reference.md) - Complete API documentation
- [Invoke Usage Guide](./invoke-usage.md) - Using invoke with tools
- [Stream Usage Guide](./stream-usage.md) - Streaming with tools
- [React Integration](./react-integration.md) - Using tools in React
- [Examples](../examples/) - Complete code examples

---

**Need Help?** Check out the [Troubleshooting Guide](./troubleshooting.md) for common issues with tools.
