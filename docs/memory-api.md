# Memory API Guide

Complete guide to using the AgentFlow Memory API for storing, searching, and managing agent memories.

## Table of Contents

- [Overview](#overview)
- [Memory Types](#memory-types)
- [Core Operations](#core-operations)
  - [Store Memory](#store-memory)
  - [Search Memory](#search-memory)
  - [Get Memory](#get-memory)
  - [Update Memory](#update-memory)
  - [Delete Memory](#delete-memory)
  - [List Memories](#list-memories)
  - [Forget Memories](#forget-memories)
- [Retrieval Strategies](#retrieval-strategies)
- [Distance Metrics](#distance-metrics)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

The Memory API allows agents to store and retrieve information across conversations, building context and knowledge over time. Memories are vector-embedded for semantic search and can be organized by type, category, and custom metadata.

### Key Features

- **Vector Embeddings**: Automatic embedding for semantic search
- **Multiple Memory Types**: Episodic, semantic, procedural, and more
- **Flexible Search**: Vector similarity, temporal, hybrid strategies
- **Rich Metadata**: Store custom metadata with each memory
- **Bulk Operations**: Forget multiple memories at once
- **Category Organization**: Organize memories by category

---

## Memory Types

```typescript
enum MemoryType {
  EPISODIC = "episodic",        // Conversation memories
  SEMANTIC = "semantic",         // Facts and knowledge
  PROCEDURAL = "procedural",     // How-to knowledge
  ENTITY = "entity",             // Entity-based memories
  RELATIONSHIP = "relationship", // Entity relationships
  CUSTOM = "custom",             // Custom memory types
  DECLARATIVE = "declarative"    // Explicit facts and events
}
```

### When to Use Each Type

| Type | Use Case | Example |
|------|----------|---------|
| **EPISODIC** | Conversation history, user events | "User asked about pricing on 2024-10-15" |
| **SEMANTIC** | Facts, knowledge, preferences | "User prefers dark mode" |
| **PROCEDURAL** | How-to information, procedures | "To reset password, click 'Forgot Password'" |
| **ENTITY** | Information about entities | "John Smith: Senior Developer at Acme Corp" |
| **RELATIONSHIP** | Entity relationships | "John Smith reports to Jane Doe" |
| **DECLARATIVE** | Explicit facts and events | "Company founded in 2010" |
| **CUSTOM** | Domain-specific memories | Application-specific data |

---

## Core Operations

### Store Memory

Store a new memory in the system.

**Signature:**
```typescript
storeMemory(request: StoreMemoryRequest): Promise<StoreMemoryResponse>
```

**Parameters:**
```typescript
interface StoreMemoryRequest {
  content: string;                   // Memory content (required)
  memory_type: MemoryType;           // Type of memory (required)
  category: string;                  // Category (required)
  metadata?: Record<string, any>;    // Additional metadata (optional)
  config?: Record<string, any>;      // Configuration (optional)
  options?: Record<string, any>;     // Storage options (optional)
}
```

**Returns:**
```typescript
interface StoreMemoryResponse {
  data: {
    memory_id: string;  // Unique ID of stored memory
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Store a semantic memory
const response = await client.storeMemory({
  content: 'User prefers email notifications over SMS',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  metadata: {
    user_id: 'user_123',
    confidence: 0.95,
    source: 'explicit_setting',
    created_at: new Date().toISOString()
  }
});

console.log('Memory ID:', response.data.memory_id);
```

**Common Categories:**

- `user_preferences` - User settings and preferences
- `conversation` - Conversation history
- `knowledge` - Facts and information
- `procedures` - How-to knowledge
- `entities` - Entity information
- `relationships` - Entity relationships

---

### Search Memory

Search for memories using vector similarity or other retrieval strategies.

**Signature:**
```typescript
searchMemory(request: SearchMemoryRequest): Promise<SearchMemoryResponse>
```

**Parameters:**
```typescript
interface SearchMemoryRequest {
  query: string;                              // Search query (required)
  memory_type?: MemoryType;                   // Filter by type
  category?: string;                          // Filter by category
  limit?: number;                             // Max results (default: 10)
  score_threshold?: number;                   // Min similarity (default: 0)
  filters?: Record<string, any>;              // Additional filters
  retrieval_strategy?: RetrievalStrategy;     // Search strategy
  distance_metric?: DistanceMetric;           // Similarity metric
  max_tokens?: number;                        // Max tokens (default: 4000)
  config?: Record<string, any>;
  options?: Record<string, any>;
}
```

**Returns:**
```typescript
interface SearchMemoryResponse {
  data: {
    results: MemoryResult[];
  };
  metadata: ResponseMetadata;
}

interface MemoryResult {
  id: string;                      // Memory ID
  content: string;                 // Memory content
  score: number;                   // Similarity score (0-1)
  memory_type: string;             // Memory type
  metadata: Record<string, any>;   // Custom metadata
  vector: number[];                // Embedding vector
  user_id: string;                 // User ID
  thread_id: string;               // Thread ID
  timestamp: string;               // Creation timestamp
}
```

**Example:**
```typescript
import { 
  MemoryType, 
  RetrievalStrategy, 
  DistanceMetric 
} from '@10xscale/agentflow-client';

// Basic search
const results = await client.searchMemory({
  query: 'user notification preferences',
  memory_type: MemoryType.SEMANTIC,
  limit: 5
});

// Advanced search with all options
const advanced = await client.searchMemory({
  query: 'how does the user prefer to be contacted',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  limit: 10,
  score_threshold: 0.7,              // Only results with 70%+ similarity
  retrieval_strategy: RetrievalStrategy.HYBRID,
  distance_metric: DistanceMetric.COSINE,
  filters: {
    user_id: 'user_123',
    source: 'explicit_setting'
  }
});

// Display results
for (const result of advanced.data.results) {
  console.log(`[${(result.score * 100).toFixed(0)}%] ${result.content}`);
}
```

---

### Get Memory

Retrieve a specific memory by ID.

**Signature:**
```typescript
getMemory(
  memoryId: string,
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
  }
): Promise<GetMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional retrieval options |

**Returns:**
```typescript
interface GetMemoryResponse {
  data: {
    memory: MemoryResult;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.getMemory('mem_abc123', {
  config: { include_vector: true }
});
const memory = response.data.memory;

console.log('Content:', memory.content);
console.log('Type:', memory.memory_type);
console.log('Created:', memory.timestamp);
console.log('Metadata:', memory.metadata);
```

---

### Update Memory

Update an existing memory's content or metadata.

**Signature:**
```typescript
updateMemory(
  memoryId: string,
  content: string,
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
    metadata?: Record<string, any>;
  }
): Promise<UpdateMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |
| content | string | Yes | Updated content for the memory |
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional update options |
| options.metadata | Record<string, any> | No | Updated metadata |

**Returns:**
```typescript
interface UpdateMemoryResponse {
  data: {
    success: boolean;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
// Update content
const response = await client.updateMemory(
  'mem_abc123',
  'User now prefers SMS notifications (changed from email)'
);

// Update with metadata
await client.updateMemory(
  'mem_abc123',
  'User now prefers SMS notifications (changed from email)',
  {
    metadata: {
      confidence: 0.98,
      updated_at: new Date().toISOString(),
      updated_by: 'user_action'
    }
  }
);
```

---

### Delete Memory

Delete a specific memory by ID.

**Signature:**
```typescript
deleteMemory(
  memoryId: string,
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
  }
): Promise<DeleteMemoryResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | Unique memory identifier |
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional delete options |

**Returns:**
```typescript
interface DeleteMemoryResponse {
  data: {
    success: boolean;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
const response = await client.deleteMemory('mem_abc123');
console.log('Deleted:', response.data.success);
```

**Warning:** This operation is permanent and cannot be undone.

---

### List Memories

List all memories with optional filtering and pagination.

**Signature:**
```typescript
listMemories(
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
    limit?: number;
  }
): Promise<ListMemoriesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional retrieval options |
| options.limit | number | No | Number of results to return |

**Returns:**
```typescript
interface ListMemoriesResponse {
  data: {
    memories: MemoryResult[];
    total?: number;  // Total count (if available)
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
// List all memories with limit
const all = await client.listMemories({ limit: 50 });
console.log(`Total: ${all.data.memories.length} memories`);

// With configuration
const configured = await client.listMemories({
  limit: 20,
  config: { include_vectors: false }
});

// Display results
for (const memory of configured.data.memories) {
  console.log(`- [${memory.memory_type}] ${memory.content}`);
}
```

---

### Forget Memories

Delete multiple memories matching specified criteria.

**Signature:**
```typescript
forgetMemories(
  options?: {
    config?: Record<string, any>;
    options?: Record<string, any>;
    memory_type?: any;
    category?: string;
    filters?: Record<string, any>;
  }
): Promise<ForgetMemoriesResponse>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| options.config | Record<string, any> | No | Optional configuration |
| options.options | Record<string, any> | No | Optional forget options |
| options.memory_type | any | No | Filter by memory type |
| options.category | string | No | Filter by category |
| options.filters | Record<string, any> | No | Additional filters |

**Returns:**
```typescript
interface ForgetMemoriesResponse {
  data: {
    success: boolean;
  };
  metadata: ResponseMetadata;
}
```

**Example:**
```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Delete by category and type
const result = await client.forgetMemories({
  memory_type: MemoryType.EPISODIC,
  category: 'old_conversations'
});
console.log('Forget success:', result.data.success);

// Delete with filters
const filtered = await client.forgetMemories({
  memory_type: MemoryType.SEMANTIC,
  filters: {
    user_id: 'user_123',
    'metadata.confidence': { $lt: 0.5 }
  }
});
```

**Warning:** This operation is permanent and cannot be undone.

---

## Retrieval Strategies

```typescript
enum RetrievalStrategy {
  SIMILARITY = "similarity",           // Vector similarity search
  TEMPORAL = "temporal",               // Time-based retrieval
  RELEVANCE = "relevance",             // Relevance scoring
  HYBRID = "hybrid",                   // Combined approaches
  GRAPH_TRAVERSAL = "graph_traversal"  // Knowledge graph navigation
}
```

### Strategy Comparison

| Strategy | Best For | How It Works |
|----------|----------|--------------|
| **SIMILARITY** | Semantic search | Uses vector embeddings to find similar content |
| **TEMPORAL** | Recent memories | Returns memories sorted by timestamp (newest first) |
| **RELEVANCE** | Context-aware search | Combines similarity with context and metadata |
| **HYBRID** | Comprehensive search | Combines multiple strategies for best results |
| **GRAPH_TRAVERSAL** | Related entities | Navigates knowledge graph to find related memories |

**Example:**
```typescript
// Similarity: Find semantically similar memories
const similar = await client.searchMemory({
  query: 'notification settings',
  retrieval_strategy: RetrievalStrategy.SIMILARITY
});

// Temporal: Get recent conversation history
const recent = await client.searchMemory({
  query: 'recent discussions',
  retrieval_strategy: RetrievalStrategy.TEMPORAL,
  memory_type: MemoryType.EPISODIC
});

// Hybrid: Best of all strategies
const comprehensive = await client.searchMemory({
  query: 'user communication preferences',
  retrieval_strategy: RetrievalStrategy.HYBRID
});
```

---

## Distance Metrics

```typescript
enum DistanceMetric {
  COSINE = "cosine",
  EUCLIDEAN = "euclidean",
  DOT_PRODUCT = "dot_product",
  MANHATTAN = "manhattan"
}
```

### Metric Comparison

| Metric | Best For | Range | Calculation |
|--------|----------|-------|-------------|
| **COSINE** | Text similarity | 0 to 1 | Angle between vectors |
| **EUCLIDEAN** | Spatial distance | 0 to ∞ | Straight-line distance |
| **DOT_PRODUCT** | Magnitude + direction | -∞ to ∞ | Vector dot product |
| **MANHATTAN** | Grid-like spaces | 0 to ∞ | Sum of absolute differences |

**Recommended:** Use `COSINE` for most text-based semantic search tasks.

**Example:**
```typescript
// Cosine similarity (most common for text)
const cosine = await client.searchMemory({
  query: 'user preferences',
  distance_metric: DistanceMetric.COSINE
});

// Euclidean distance
const euclidean = await client.searchMemory({
  query: 'user preferences',
  distance_metric: DistanceMetric.EUCLIDEAN
});
```

---

## Use Cases

### 1. User Preferences Management

```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Store preference
await client.storeMemory({
  content: 'User prefers dark mode with compact layout',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  metadata: {
    user_id: 'user_123',
    preference_type: 'ui',
    confidence: 1.0,
    source: 'explicit_setting'
  }
});

// Retrieve preferences
const prefs = await client.searchMemory({
  query: 'user interface preferences',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  filters: { user_id: 'user_123' }
});
```

### 2. Conversation History

```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Store conversation turn
await client.storeMemory({
  content: 'User asked about pricing plans for enterprise tier',
  memory_type: MemoryType.EPISODIC,
  category: 'conversation',
  metadata: {
    user_id: 'user_123',
    thread_id: 'thread_456',
    topic: 'pricing',
    timestamp: new Date().toISOString()
  }
});

// Retrieve conversation context
const context = await client.searchMemory({
  query: 'previous pricing discussions',
  memory_type: MemoryType.EPISODIC,
  category: 'conversation',
  limit: 10,
  retrieval_strategy: RetrievalStrategy.TEMPORAL
});
```

### 3. Knowledge Base

```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Store knowledge
await client.storeMemory({
  content: 'Company policy: Remote work allowed up to 3 days per week',
  memory_type: MemoryType.SEMANTIC,
  category: 'company_policies',
  metadata: {
    policy_id: 'POL-001',
    effective_date: '2024-01-01',
    department: 'HR'
  }
});

// Search knowledge base
const policies = await client.searchMemory({
  query: 'remote work policy',
  memory_type: MemoryType.SEMANTIC,
  category: 'company_policies',
  score_threshold: 0.8
});
```

### 4. Entity Relationships

```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Store entity
await client.storeMemory({
  content: 'John Smith: Senior Developer, email: john@example.com',
  memory_type: MemoryType.ENTITY,
  category: 'employees',
  metadata: {
    entity_id: 'emp_123',
    department: 'Engineering',
    role: 'Senior Developer'
  }
});

// Store relationship
await client.storeMemory({
  content: 'John Smith reports to Jane Doe (Engineering Manager)',
  memory_type: MemoryType.RELATIONSHIP,
  category: 'org_structure',
  metadata: {
    from_entity: 'emp_123',
    to_entity: 'emp_456',
    relationship_type: 'reports_to'
  }
});

// Find related entities
const related = await client.searchMemory({
  query: 'who does John Smith report to',
  memory_type: MemoryType.RELATIONSHIP,
  retrieval_strategy: RetrievalStrategy.GRAPH_TRAVERSAL
});
```

### 5. Procedural Knowledge

```typescript
import { MemoryType } from '@10xscale/agentflow-client';

// Store procedure
await client.storeMemory({
  content: 'To reset password: 1) Click "Forgot Password" 2) Enter email 3) Check inbox for reset link',
  memory_type: MemoryType.PROCEDURAL,
  category: 'help_guides',
  metadata: {
    topic: 'account_management',
    difficulty: 'easy',
    steps: 3
  }
});

// Search procedures
const howto = await client.searchMemory({
  query: 'how to reset password',
  memory_type: MemoryType.PROCEDURAL,
  category: 'help_guides'
});
```

---

## Best Practices

### 1. Use Appropriate Memory Types

Choose the right memory type for your data:

```typescript
// ✅ Good: Semantic for facts
await client.storeMemory({
  content: 'User timezone: America/New_York',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_info'
});

// ❌ Bad: Episodic for facts
await client.storeMemory({
  content: 'User timezone: America/New_York',
  memory_type: MemoryType.EPISODIC,  // Wrong type!
  category: 'user_info'
});
```

### 2. Add Rich Metadata

Include metadata for filtering and context:

```typescript
// ✅ Good: Rich metadata
await client.storeMemory({
  content: 'User prefers email notifications',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences',
  metadata: {
    user_id: 'user_123',
    confidence: 0.95,
    source: 'explicit_setting',
    created_at: new Date().toISOString(),
    created_by: 'preferences_service'
  }
});

// ❌ Bad: No metadata
await client.storeMemory({
  content: 'User prefers email notifications',
  memory_type: MemoryType.SEMANTIC,
  category: 'user_preferences'
  // Missing metadata!
});
```

### 3. Use Categories Consistently

Organize memories with consistent categories:

```typescript
// ✅ Good: Consistent naming
'user_preferences'
'user_info'
'conversation'
'company_policies'

// ❌ Bad: Inconsistent naming
'UserPreferences'
'user-info'
'CONVERSATION'
'company policies'  // Spaces!
```

### 4. Set Appropriate Score Thresholds

Use score thresholds to filter low-quality results:

```typescript
// High precision (fewer, more relevant results)
const precise = await client.searchMemory({
  query: 'critical information',
  score_threshold: 0.9  // 90%+ similarity
});

// High recall (more results, some less relevant)
const comprehensive = await client.searchMemory({
  query: 'general information',
  score_threshold: 0.6  // 60%+ similarity
});
```

### 5. Clean Up Old Memories

Periodically remove outdated or low-confidence memories:

```typescript
// Delete old conversation history
await client.forgetMemories({
  memory_type: MemoryType.EPISODIC,
  category: 'old_conversations'
});

// Delete low-confidence memories
await client.forgetMemories({
  memory_type: MemoryType.SEMANTIC,
  filters: {
    'metadata.confidence': { $lt: 0.5 }
  }
});
```

### 6. Batch Operations When Possible

Use `forgetMemories` for bulk operations:

```typescript
// ✅ Good: Batch delete with filter
await client.forgetMemories({
  category: 'temporary',
  memory_type: MemoryType.EPISODIC
});

// ❌ Bad: Individual deletes
for (const id of ids) {
  await client.deleteMemory(id);  // Slower!
}
```

---

## Examples

### Complete Memory Management Example

```typescript
import { 
  AgentFlowClient, 
  MemoryType, 
  RetrievalStrategy 
} from '@10xscale/agentflow-client';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});

async function manageUserMemories(userId: string) {
  // 1. Store user preference
  const stored = await client.storeMemory({
    content: 'User prefers concise responses with code examples',
    memory_type: MemoryType.SEMANTIC,
    category: 'user_preferences',
    metadata: {
      user_id: userId,
      preference_type: 'communication_style',
      confidence: 0.95
    }
  });
  console.log('Stored:', stored.data.memory_id);
  
  // 2. Search for relevant memories
  const relevant = await client.searchMemory({
    query: 'how does user prefer to receive information',
    memory_type: MemoryType.SEMANTIC,
    category: 'user_preferences',
    filters: { user_id: userId },
    limit: 5,
    score_threshold: 0.7
  });
  
  console.log(`Found ${relevant.data.results.length} relevant memories:`);
  for (const memory of relevant.data.results) {
    console.log(`- [${(memory.score * 100).toFixed(0)}%] ${memory.content}`);
  }
  
  // 3. List all user memories
  const all = await client.listMemories({
    limit: 50
  });
  console.log(`Total memories: ${all.data.memories.length}`);
  
  // 4. Update a memory
  if (relevant.data.results.length > 0) {
    const first = relevant.data.results[0];
    await client.updateMemory(
      first.id,
      first.content,
      {
        metadata: {
          ...first.metadata,
          last_accessed: new Date().toISOString()
        }
      }
    );
  }
  
  // 5. Clean up old memories
  const deleted = await client.forgetMemories({
    memory_type: MemoryType.EPISODIC,
    category: 'old_conversations',
    filters: { user_id: userId }
  });
  console.log('Forget success:', deleted.data.success);
}
```

---

## Error Handling

All memory operations may throw errors. See [Error Handling Guide](./error-handling.md) for details.

```typescript
import { AgentFlowError, NotFoundError } from '@10xscale/agentflow-client';

try {
  const memory = await client.getMemory('mem_123');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Memory not found');
  } else if (error instanceof AgentFlowError) {
    console.error('Error:', error.message);
    console.error('Request ID:', error.requestId);
  }
}
```

---

## See Also

- [API Reference](./api-reference.md) - Complete API documentation
- [Error Handling Guide](./error-handling.md) - Error handling patterns
- [Quick Start Guide](./QUICK_START_NEW.md) - Getting started guide
