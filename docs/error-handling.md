# Error Handling Guide

Complete guide to handling errors in agentflow-react.

## Table of Contents

- [Overview](#overview)
- [Error Classes](#error-classes)
- [Error Response Structure](#error-response-structure)
- [Catching Errors](#catching-errors)
- [Error Properties](#error-properties)
- [Handling Specific Errors](#handling-specific-errors)
- [Validation Errors](#validation-errors)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

The agentflow-react library provides structured error handling with specific error classes for different HTTP status codes. All errors extend the base `AgentFlowError` class and include rich information like request IDs, timestamps, and detailed error messages.

### Benefits

- **Type-Safe**: Use TypeScript `instanceof` checks
- **Rich Information**: Request IDs, timestamps, error codes
- **Easy Debugging**: Include request IDs in support tickets
- **Validation Details**: Field-level validation errors for 422 responses
- **Consistent**: Same error structure across all endpoints

---

## Error Classes

All error classes are exported from `agentflow-react` and can be imported directly:

```typescript
import { 
  AgentFlowError,
  BadRequestError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  ServerError
} from 'agentflow-react';
```

### Error Class Hierarchy

```
AgentFlowError (Base)
├── BadRequestError (400)
├── AuthenticationError (401)
├── PermissionError (403)
├── NotFoundError (404)
├── ValidationError (422)
└── ServerError (500, 502, 503, 504)
```

### Error Class Details

| Class | Status Code | Error Code | When It Occurs |
|-------|-------------|------------|----------------|
| `BadRequestError` | 400 | `BAD_REQUEST` | Invalid request data, malformed JSON |
| `AuthenticationError` | 401 | `AUTHENTICATION_FAILED` | Missing or invalid auth token |
| `PermissionError` | 403 | `PERMISSION_ERROR` | No permission to access resource |
| `NotFoundError` | 404 | `RESOURCE_NOT_FOUND` | Thread, message, or memory not found |
| `ValidationError` | 422 | `VALIDATION_ERROR` | Field validation failed |
| `ServerError` | 500+ | `INTERNAL_SERVER_ERROR` | Server-side errors |

---

## Error Response Structure

All errors from the API follow this structure:

```json
{
  "metadata": {
    "message": "Failed",
    "request_id": "9843ae2e8f054fc7b6fcadf743483a08",
    "timestamp": "2025-10-26T12:05:32.987017"
  },
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input, please check the input data for any errors",
    "details": []
  }
}
```

The library automatically parses this and creates the appropriate error class.

---

## Catching Errors

### Basic Error Handling

```typescript
import { AgentFlowClient, AgentFlowError } from 'agentflow-react';

const client = new AgentFlowClient({
  baseUrl: 'https://api.example.com',
  authToken: 'your-token'
});

try {
  const response = await client.ping();
  console.log('Success:', response.data);
} catch (error) {
  if (error instanceof AgentFlowError) {
    // All AgentFlow errors
    console.error('AgentFlow Error:', error.message);
    console.error('Request ID:', error.requestId);
    console.error('Error Code:', error.errorCode);
  } else {
    // Network errors, timeouts, etc.
    console.error('Unexpected error:', error);
  }
}
```

### Catching Specific Errors

```typescript
import {
  NotFoundError,
  AuthenticationError,
  ValidationError,
  ServerError
} from 'agentflow-react';

try {
  const thread = await client.threadDetails('thread_123');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication failure
    console.log('Please log in again');
    redirectToLogin();
  } else if (error instanceof NotFoundError) {
    // Handle not found
    console.log('Thread not found');
    showNotFoundPage();
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Validation failed');
    displayValidationErrors(error.details);
  } else if (error instanceof ServerError) {
    // Handle server errors
    console.log('Server error, please try again');
    showRetryOption();
  }
}
```

---

## Error Properties

All error classes extend `AgentFlowError` and include these properties:

```typescript
class AgentFlowError extends Error {
  statusCode: number;           // HTTP status code (400, 401, 404, etc.)
  errorCode: string;            // API error code ('BAD_REQUEST', etc.)
  requestId?: string;           // Request ID from API (for debugging)
  timestamp?: string;           // Error timestamp
  details?: ErrorDetail[];      // Detailed error information (especially for ValidationError)
}
```

### ErrorDetail Structure

```typescript
interface ErrorDetail {
  loc?: (string | number)[];    // Field location (e.g., ["body", "name"])
  msg: string;                  // Error message
  type: string;                 // Error type (e.g., "value_error.missing")
}
```

---

## Handling Specific Errors

### 400 Bad Request

Occurs when the request data is malformed or invalid.

```typescript
import { BadRequestError } from 'agentflow-react';

try {
  await client.updateThreadState('thread_123', {
    state: invalidData  // Malformed data
  });
} catch (error) {
  if (error instanceof BadRequestError) {
    console.error('Bad request:', error.message);
    console.error('Request ID:', error.requestId);
    
    // Fix the data and retry
    const fixedData = fixData(invalidData);
    await client.updateThreadState('thread_123', { state: fixedData });
  }
}
```

### 401 Authentication Error

Occurs when the auth token is missing, invalid, or expired.

```typescript
import { AuthenticationError } from 'agentflow-react';

try {
  await client.threads();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed');
    console.error('Request ID:', error.requestId);
    
    // Redirect to login or refresh token
    await refreshAuthToken();
    // Or redirect to login page
    window.location.href = '/login';
  }
}
```

### 403 Permission Error

Occurs when the user doesn't have permission to perform the action.

```typescript
import { PermissionError } from 'agentflow-react';

try {
  await client.deleteThread('thread_123');
} catch (error) {
  if (error instanceof PermissionError) {
    console.error('Permission denied');
    console.error('Request ID:', error.requestId);
    
    // Show error message to user
    showAlert('You do not have permission to delete this thread');
  }
}
```

### 404 Not Found

Occurs when the requested resource doesn't exist.

```typescript
import { NotFoundError } from 'agentflow-react';

try {
  const message = await client.threadMessage('thread_123', 'msg_999');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('Resource not found');
    console.error('Request ID:', error.requestId);
    
    // Show appropriate UI
    showNotFoundPage();
    // Or redirect
    router.push('/threads');
  }
}
```

### 422 Validation Error

Occurs when field validation fails. **Most detailed error type** with field-level information.

```typescript
import { ValidationError } from 'agentflow-react';

try {
  await client.updateThreadState('thread_123', {
    state: {
      step: 123,  // Should be string
      // Missing required field 'status'
    }
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Request ID:', error.requestId);
    
    // Access detailed validation errors
    if (error.details) {
      for (const detail of error.details) {
        const fieldPath = detail.loc?.join('.') || 'unknown';
        console.error(`Field ${fieldPath}: ${detail.msg}`);
      }
    }
    
    // Example output:
    // Field body.state.step: value is not a valid string
    // Field body.state.status: field required
    
    // Show errors in UI
    displayFieldErrors(error.details);
  }
}
```

### 500+ Server Errors

Occurs when there's a server-side issue.

```typescript
import { ServerError } from 'agentflow-react';

try {
  await client.invoke(request);
} catch (error) {
  if (error instanceof ServerError) {
    console.error('Server error:', error.message);
    console.error('Status code:', error.statusCode);  // 500, 502, 503, or 504
    console.error('Request ID:', error.requestId);     // Important for support!
    
    // Show retry option
    const retry = await showRetryDialog(
      'Server error occurred. Please try again.',
      error.requestId  // Show this to user for support
    );
    
    if (retry) {
      await client.invoke(request);
    }
  }
}
```

---

## Validation Errors

Validation errors (422) include detailed field-level error information.

### Example Validation Error Response

```json
{
  "metadata": {
    "message": "Failed",
    "request_id": "6b08dd969bc44f4c8e9735ee14d9de0e",
    "timestamp": "2025-10-26T12:05:32.989646"
  },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "loc": ["body", "state", "name"],
        "msg": "field required",
        "type": "value_error.missing"
      },
      {
        "loc": ["body", "state", "age"],
        "msg": "value is not a valid integer",
        "type": "type_error.integer"
      }
    ]
  }
}
```

### Handling Validation Errors in Forms

```typescript
import { ValidationError } from 'agentflow-react';

async function submitForm(formData: any) {
  try {
    await client.updateThreadState('thread_123', {
      state: formData
    });
    
    showSuccess('Saved successfully');
  } catch (error) {
    if (error instanceof ValidationError) {
      // Create field error map
      const fieldErrors: Record<string, string> = {};
      
      if (error.details) {
        for (const detail of error.details) {
          // Extract field name from location
          // ["body", "state", "name"] -> "name"
          const fieldName = detail.loc?.[detail.loc.length - 1] || 'unknown';
          fieldErrors[fieldName] = detail.msg;
        }
      }
      
      // Display errors in form
      displayFormErrors(fieldErrors);
      
      // Example:
      // { name: "field required", age: "value is not a valid integer" }
    } else {
      showError('An error occurred. Please try again.');
    }
  }
}
```

### React Form Example

```typescript
import { useState } from 'react';
import { ValidationError } from 'agentflow-react';

function MyForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  async function handleSubmit(data: any) {
    try {
      await client.updateThreadState('thread_123', { state: data });
      setErrors({});  // Clear errors on success
    } catch (error) {
      if (error instanceof ValidationError && error.details) {
        const newErrors: Record<string, string> = {};
        for (const detail of error.details) {
          const field = detail.loc?.[detail.loc.length - 1] as string;
          newErrors[field] = detail.msg;
        }
        setErrors(newErrors);
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <input name="age" type="number" />
      {errors.age && <span className="error">{errors.age}</span>}
    </form>
  );
}
```

---

## Best Practices

### 1. Always Include Request IDs in Support Tickets

```typescript
try {
  await client.invoke(request);
} catch (error) {
  if (error instanceof AgentFlowError) {
    // Log with request ID
    logger.error('Invoke failed', {
      message: error.message,
      requestId: error.requestId,  // ⭐ Include this!
      errorCode: error.errorCode,
      timestamp: error.timestamp
    });
    
    // Show to user for support
    showErrorDialog(
      `Error occurred. If this persists, contact support with Request ID: ${error.requestId}`
    );
  }
}
```

### 2. Handle Authentication Errors Globally

```typescript
// Create a wrapper function
async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      // Global auth error handling
      await refreshToken();
      // Retry once
      return await fn();
    }
    throw error;  // Re-throw other errors
  }
}

// Usage
const threads = await apiCall(() => client.threads());
```

### 3. Show User-Friendly Messages

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return 'Please log in again to continue.';
  }
  if (error instanceof NotFoundError) {
    return 'The requested resource was not found.';
  }
  if (error instanceof ValidationError) {
    return 'Please check your input and try again.';
  }
  if (error instanceof ServerError) {
    return 'Server error. Please try again later.';
  }
  if (error instanceof AgentFlowError) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}

// Usage
try {
  await client.deleteThread('thread_123');
} catch (error) {
  const message = getErrorMessage(error);
  showNotification(message);
}
```

### 4. Implement Retry Logic for Server Errors

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ServerError && i < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const result = await withRetry(() => 
  client.invoke({ messages: [...] })
);
```

### 5. Log Errors Properly

```typescript
interface ErrorLog {
  message: string;
  statusCode: number;
  errorCode: string;
  requestId?: string;
  timestamp?: string;
  endpoint: string;
}

function logError(error: unknown, endpoint: string): void {
  if (error instanceof AgentFlowError) {
    const log: ErrorLog = {
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      requestId: error.requestId,
      timestamp: error.timestamp,
      endpoint
    };
    
    // Send to your logging service
    logger.error('AgentFlow API Error', log);
  } else {
    logger.error('Unexpected Error', { error, endpoint });
  }
}

// Usage
try {
  await client.threads();
} catch (error) {
  logError(error, 'threads');
  throw error;
}
```

---

## Examples

### Complete Error Handling Example

```typescript
import {
  AgentFlowClient,
  AgentFlowError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ServerError,
  Message
} from 'agentflow-react';

class AgentFlowService {
  private client: AgentFlowClient;
  
  constructor(baseUrl: string, authToken: string) {
    this.client = new AgentFlowClient({ baseUrl, authToken });
  }
  
  async invokeAgent(messages: Message[]): Promise<any> {
    try {
      const result = await this.client.invoke({
        messages,
        granularity: 'full',
        recursion_limit: 10
      });
      
      return {
        success: true,
        data: result,
        error: null
      };
      
    } catch (error) {
      // Handle specific errors
      if (error instanceof AuthenticationError) {
        console.error('Authentication failed:', error.requestId);
        return {
          success: false,
          error: 'Please log in again',
          shouldRetry: false,
          shouldReauth: true
        };
      }
      
      if (error instanceof ValidationError) {
        console.error('Validation failed:', error.details);
        return {
          success: false,
          error: 'Invalid input data',
          validationErrors: error.details,
          shouldRetry: false
        };
      }
      
      if (error instanceof ServerError) {
        console.error('Server error:', error.requestId);
        return {
          success: false,
          error: 'Server error occurred',
          requestId: error.requestId,
          shouldRetry: true
        };
      }
      
      if (error instanceof AgentFlowError) {
        console.error('AgentFlow error:', error.message);
        return {
          success: false,
          error: error.message,
          requestId: error.requestId,
          shouldRetry: false
        };
      }
      
      // Unknown error
      console.error('Unexpected error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
        shouldRetry: true
      };
    }
  }
}
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { AgentFlowClient, AgentFlowError, ValidationError } from 'agentflow-react';

function useAgentFlow(client: AgentFlowClient) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const invoke = useCallback(async (messages: Message[]) => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    
    try {
      const result = await client.invoke({ messages });
      return result;
      
    } catch (err) {
      if (err instanceof ValidationError) {
        setError('Validation failed');
        
        const errors: Record<string, string> = {};
        if (err.details) {
          for (const detail of err.details) {
            const field = detail.loc?.[detail.loc.length - 1] as string;
            errors[field] = detail.msg;
          }
        }
        setValidationErrors(errors);
        
      } else if (err instanceof AgentFlowError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      
      throw err;
      
    } finally {
      setLoading(false);
    }
  }, [client]);
  
  return { invoke, loading, error, validationErrors };
}
```

---

## Summary

- **Import error classes** from `agentflow-react`
- **Use `instanceof` checks** for type-safe error handling
- **Access `error.requestId`** for debugging and support tickets
- **Handle validation errors** with field-level detail
- **Implement retry logic** for server errors
- **Show user-friendly messages** in your UI
- **Log errors properly** with request IDs and context

For complete API reference, see [API Reference](./api-reference.md).
