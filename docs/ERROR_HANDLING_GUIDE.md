# Error Handling Quick Reference

## Import Error Classes

```typescript
import {
  AgentFlowError,      // Base error class
  BadRequestError,     // 400
  AuthenticationError, // 401
  PermissionError,     // 403
  NotFoundError,       // 404
  ValidationError,     // 422
  ServerError          // 500, 502, 503, 504
} from 'agentflow-react';
```

## Error Properties

All error classes have these properties:

```typescript
error.message       // Error message
error.statusCode    // HTTP status code (400, 401, 403, 404, 422, 500, etc.)
error.errorCode     // API error code ('BAD_REQUEST', 'AUTHENTICATION_FAILED', etc.)
error.requestId     // Request ID for tracing (e.g., '9843ae2e8f054fc7b6fcadf743483a08')
error.timestamp     // ISO timestamp (e.g., '2025-10-26T12:05:32.987017')
error.details       // Array of error details (especially useful for validation errors)
```

## Common Patterns

### Pattern 1: Handle Specific Errors

```typescript
try {
  await client.threadState(threadId);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Thread not found:', error.requestId);
  } else if (error instanceof AuthenticationError) {
    console.log('Please log in again');
  } else if (error instanceof ServerError) {
    console.log('Server error, please try again');
  }
}
```

### Pattern 2: Show Validation Errors

```typescript
try {
  await client.updateThreadState(threadId, request);
} catch (error) {
  if (error instanceof ValidationError) {
    error.details.forEach(detail => {
      const fieldPath = detail.loc?.join('.') || 'unknown';
      console.log(`${fieldPath}: ${detail.msg}`);
    });
  }
}
```

### Pattern 3: Log Request IDs for Support

```typescript
try {
  await client.invoke(messages);
} catch (error) {
  if (error instanceof AgentFlowError) {
    console.error('Error occurred:', {
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      requestId: error.requestId,  // Give this to support
      timestamp: error.timestamp
    });
  }
}
```

### Pattern 4: Retry on Server Errors

```typescript
async function invokeWithRetry(client, messages, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.invoke(messages);
    } catch (error) {
      if (error instanceof ServerError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}
```

### Pattern 5: User-Friendly Error Messages

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return 'Your session has expired. Please log in again.';
  }
  if (error instanceof PermissionError) {
    return 'You don\'t have permission to perform this action.';
  }
  if (error instanceof NotFoundError) {
    return 'The requested resource was not found.';
  }
  if (error instanceof ValidationError) {
    return 'Please check your input: ' + error.details
      .map(d => d.msg)
      .join(', ');
  }
  if (error instanceof BadRequestError) {
    return 'Invalid request. Please check your input.';
  }
  if (error instanceof ServerError) {
    return 'Server error. Please try again later.';
  }
  return 'An unexpected error occurred.';
}
```

## Error Details Structure (422 Validation Errors)

```typescript
interface ErrorDetail {
  loc?: string[];      // Field path, e.g., ['body', 'name']
  msg?: string;        // Error message, e.g., 'field required'
  type?: string;       // Error type, e.g., 'value_error.missing'
}
```

Example validation error:

```typescript
{
  loc: ['body', 'name'],
  msg: 'field required',
  type: 'value_error.missing'
}
```

## All Endpoints Support Error Handling

- ✅ `client.ping()`
- ✅ `client.graph()`
- ✅ `client.stateSchema()`
- ✅ `client.invoke()`
- ✅ `client.stream()`
- ✅ `client.threads()`
- ✅ `client.threadState()`
- ✅ `client.threadDetails()`
- ✅ `client.threadMessage()`
- ✅ `client.threadMessages()`
- ✅ `client.addThreadMessages()`
- ✅ `client.updateThreadState()`
- ✅ `client.clearThreadState()`
- ✅ `client.deleteThread()`
- ✅ `client.deleteThreadMessage()`

## Status Code Reference

| Code | Error Class | Common Scenarios |
|------|-------------|------------------|
| 400 | BadRequestError | Malformed request, invalid parameters |
| 401 | AuthenticationError | Missing or invalid auth token |
| 403 | PermissionError | Valid auth but insufficient permissions |
| 404 | NotFoundError | Thread/resource doesn't exist |
| 422 | ValidationError | Request validation failed |
| 500 | ServerError | Internal server error |
| 502 | ServerError | Bad gateway |
| 503 | ServerError | Service unavailable |
| 504 | ServerError | Gateway timeout |
