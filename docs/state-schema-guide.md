# State Schema API Guide

## Overview

The **State Schema API** (`GET /v1/graph:StateSchema`) returns the **complete JSON Schema definition** for the `AgentState` object. This allows users to programmatically understand:

- What fields are available in `AgentState`
- What type each field expects (string, array, object, number, boolean, etc.)
- What the default values are for each field
- Field descriptions and documentation
- Validation constraints
- Which fields are required

This enables users to:
1. **Build dynamic forms** based on the schema
2. **Validate data** before sending to the API
3. **Generate UI components** automatically
4. **Understand the data structure** without reading source code

## Usage

### Basic Example

```typescript
import { AgentFlowClient } from 'agentflow-react';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});

// Fetch the complete state schema
const schemaResponse = await client.graphStateSchema();

// Access the schema data
const schema = schemaResponse.data;

console.log('Title:', schema.title);
console.log('Description:', schema.description);

// Iterate through all available fields
Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
  console.log(`Field: ${fieldName}`);
  console.log(`  Type: ${fieldSchema.type}`);
  console.log(`  Description: ${fieldSchema.description}`);
  console.log(`  Default: ${fieldSchema.default}`);
});
```

### Response Structure

```typescript
{
  data: {
    title: "AgentState",
    description: "Schema for agent execution state",
    type: "object",
    properties: {
      context: {
        type: "array",
        description: "List of context items",
        items: { /* item schema */ },
        default: []
      },
      context_summary: {
        description: "Summary of context",
        anyOf: [{ type: "string" }, { type: "null" }],
        default: null
      },
      execution_meta: {
        type: "object",
        description: "Execution metadata",
        properties: {
          current_node: { type: "string" },
          step: { type: "integer" },
          is_running: { type: "boolean" },
          is_interrupted: { type: "boolean" },
          is_stopped_requested: { type: "boolean" }
        }
      },
      // Dynamic fields (example - actual fields depend on server config)
      cv_text: { type: "string", default: "", description: "CV content" },
      cid: { type: "string", default: "", description: "Candidate ID" },
      jd_text: { type: "string", default: "", description: "Job description" },
      jd_id: { type: "string", default: "", description: "Job description ID" }
    }
  },
  metadata: {
    request_id: "req-123",
    timestamp: "2025-10-19T15:50:53.000Z",
    message: "OK"
  }
}
```

## Field Schema Structure

Each field in the `properties` object follows this structure:

```typescript
interface FieldSchema {
  // Basic type information
  type?: string | string[];              // e.g., "string", "array", "object", "integer"
  description?: string;                   // Human-readable field description
  
  // Default value
  default?: any;                          // Default value if not provided
  
  // For array types
  items?: FieldSchema;                    // Schema for array items
  
  // For object types
  properties?: Record<string, FieldSchema>;
  required?: string[];
  
  // For complex types
  anyOf?: any[];                          // "any of these types"
  allOf?: any[];                          // "all of these must be true"
  oneOf?: any[];                          // "exactly one of these"
  
  // Additional constraints
  enum?: any[];                           // Allowed values
  
  // Advanced features
  $ref?: string;                          // Reference to other schema definitions
  $defs?: Record<string, any>;            // Additional schema definitions
}
```

## Use Cases

### 1. Build a Dynamic Form

```typescript
async function generateFormFields() {
  const schemaResponse = await client.graphStateSchema();
  const schema = schemaResponse.data;
  
  const formFields = [];
  
  Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
    const field = {
      name: fieldName,
      type: fieldSchema.type,
      label: fieldSchema.description || fieldName,
      default: fieldSchema.default,
      required: schema.required?.includes(fieldName) || false
    };
    
    formFields.push(field);
  });
  
  return formFields;
}
```

### 2. Validate Data Before Sending

```typescript
function validateAgentState(data: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const schema = await client.graphStateSchema();
  const errors = [];
  
  // Check required fields
  if (schema.data.required) {
    for (const field of schema.data.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Check field types
  Object.entries(data).forEach(([fieldName, value]) => {
    const fieldSchema = schema.data.properties[fieldName];
    if (!fieldSchema) return;
    
    const expectedType = fieldSchema.type;
    const actualType = typeof value;
    
    if (expectedType && !Array.isArray(expectedType)) {
      if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`Field ${fieldName} should be an array`);
      } else if (expectedType !== actualType && value !== null) {
        errors.push(`Field ${fieldName} should be ${expectedType}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### 3. Display Field Information

```typescript
async function displayFieldInfo() {
  const schemaResponse = await client.graphStateSchema();
  const schema = schemaResponse.data;
  
  console.log('📋 AgentState Fields:');
  console.log('═'.repeat(60));
  
  Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
    console.log(`\n📌 ${fieldName}`);
    console.log(`   Type: ${fieldSchema.type || 'unknown'}`);
    
    if (fieldSchema.description) {
      console.log(`   Description: ${fieldSchema.description}`);
    }
    
    if (fieldSchema.default !== undefined) {
      console.log(`   Default: ${JSON.stringify(fieldSchema.default)}`);
    }
    
    if (fieldSchema.enum) {
      console.log(`   Allowed values: ${fieldSchema.enum.join(', ')}`);
    }
  });
}
```

## Dynamic Fields

The `AgentState` schema supports **dynamic fields** beyond the core fields (`context`, `context_summary`, `execution_meta`). Dynamic fields can vary depending on your server configuration.

Common dynamic field examples:
- `cv_text`: Candidate CV content
- `cid`: Candidate ID
- `jd_text`: Job description text
- `jd_id`: Job description ID

To access dynamic fields:

```typescript
const schema = await client.graphStateSchema();

// Core fields (always present)
const contextField = schema.data.properties.context;
const executionMetaField = schema.data.properties.execution_meta;

// Dynamic fields (varies by configuration)
Object.entries(schema.data.properties).forEach(([name, fieldSchema]) => {
  // Check if it's a dynamic field
  if (!['context', 'context_summary', 'execution_meta'].includes(name)) {
    console.log(`Dynamic field: ${name} (${fieldSchema.type})`);
  }
});
```

## Type Definitions

### StateSchemaResponse
```typescript
interface StateSchemaResponse {
  data: AgentStateSchema;
  metadata: ResponseMetadata;
}
```

### AgentStateSchema
```typescript
interface AgentStateSchema {
  title?: string;
  description?: string;
  type?: string;
  properties: Record<string, FieldSchema>;
  required?: string[];
  $defs?: Record<string, any>;
  [key: string]: any;
}
```

### FieldSchema
```typescript
interface FieldSchema {
  type?: string | string[];
  description?: string;
  default?: any;
  items?: any;
  properties?: Record<string, FieldSchema>;
  required?: string[];
  enum?: any[];
  $ref?: string;
  $defs?: Record<string, any>;
  anyOf?: any[];
  allOf?: any[];
  oneOf?: any[];
  [key: string]: any;
}
```

## Error Handling

```typescript
try {
  const schema = await client.graphStateSchema();
  // Use schema
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      console.error('Schema fetch timed out');
    } else if (error.message.includes('HTTP')) {
      console.error('Server error:', error.message);
    } else {
      console.error('Network error:', error.message);
    }
  }
}
```

## Benefits

✅ **Type Safety**: Know exactly what fields and types are expected
✅ **Dynamic UI Generation**: Create forms automatically from schema
✅ **Data Validation**: Validate before sending to server
✅ **Self-Documenting**: Schema contains descriptions and defaults
✅ **Extensible**: Supports both core and custom/dynamic fields
✅ **Backward Compatible**: New fields can be added without breaking clients

## See Also

- **[React Examples](./react-examples.md)** - React components using state schema for dynamic forms
- **[React Integration](./react-integration.md)** - useStateSchema hook for React
- **[API Reference](./api-reference.md)** - Complete state schema API documentation
- **[State Schema Quick Reference](./state-schema-quick-ref.md)** - Quick lookup for field types
- **[TypeScript Types](./typescript-types.md)** - Type definitions for state schema
- **[Getting Started](./getting-started.md)** - Basic state schema usage
- [State Schema Tests](../tests/stateSchema.test.ts) - Test examples
