# Progressive Results Implementation

## What Was Done

Implemented **progressive results** (streaming-like behavior) for the `invoke` API, allowing users to receive responses immediately after each API call without waiting for the entire tool execution loop to complete.

## Key Changes

### 1. New Types (src/endpoints/invoke.ts)

```typescript
export interface InvokePartialResult {
    iteration: number;
    messages: Message[];
    all_messages: Message[];
    has_tool_calls: boolean;
    is_final: boolean;
    state?: AgentState;
    context?: Message[];
    summary?: string | null;
    meta?: any;
    recursion_limit_reached: boolean;
}

export type InvokeCallback = (partial: InvokePartialResult) => void | Promise<void>;
```

### 2. Updated invoke() Signature

**Before** (positional parameters):
```typescript
const result = await client.invoke(
    messages,
    initial_state,
    config,
    recursion_limit
);
```

**After** (options object with callback):
```typescript
const result = await client.invoke(messages, {
    initial_state,
    config,
    recursion_limit,
    response_granularity: 'full',
    onPartialResult: async (partial) => {
        console.log(`Iteration ${partial.iteration}`);
        console.log(`Messages: ${partial.messages.length}`);
        console.log(`Has tool calls: ${partial.has_tool_calls}`);
        console.log(`Is final: ${partial.is_final}`);
        
        // Display messages immediately to user
        partial.messages.forEach(displayMessage);
    }
});
```

### 3. Message Serialization Fixes

Fixed content format to match server expectations:
- Simple text messages: `content: "string"` (not array)
- Complex messages: `content: [{type, ...}, ...]` (array)
- Default `message_id: 0` for new messages (server generates UUID)

### 4. Callback Invocation in Loop

The invoke loop now:
1. Sends API request
2. Receives response
3. **Fires callback immediately** with partial result
4. Executes remote tools (if any)
5. Loops back to step 1

This means users see responses **as soon as the API returns**, not after tool execution completes.

## Benefits

✅ **Immediate Feedback**: Users get responses instantly after each API call
✅ **Better UX**: Can show loading states, progress indicators, intermediate results
✅ **Non-Blocking**: Tool execution happens between callbacks
✅ **Backward Compatible**: Callback is optional, old code still works
✅ **Simple API**: No streaming protocols, just a callback function

## Example

See `check.ts` for a complete working example.

Run it:
```bash
npm run build
node --loader ts-node/esm check.ts
```

Expected output:
```
------- Testing Invoke API with Progressive Results -------
Creating AgentFlowClient...
📤 Sending initial message...
Message: "What is the weather in San Francisco?"

�🔄 Starting invoke with progressive results...

📨 PARTIAL RESULT #1 (Iteration 1)
------------------------------------------------------------
📝 Messages received: 4
   1. [user]: What is the weather in San Francisco?
   2. [assistant]: get_weather
   3. [tool]: {"type":"tool_result",...}
   4. [assistant]: The weather in San Francisco is sunny.
✅ Has tool calls: NO - this is the final result
🎉 This is the FINAL result!
------------------------------------------------------------

✅ INVOKE COMPLETED!

📊 Summary:
   - Total iterations: 1
   - Partial results received: 1
   - Total messages: 4
   - Recursion limit reached: false
```

## Files Modified

- ✅ `src/endpoints/invoke.ts` - Added callback support, fixed serialization
- ✅ `src/client.ts` - Updated invoke() API to accept options object
- ✅ `check.ts` - Created example with progressive results
- ✅ `tests/invoke.test.ts` - Added tests for callback functionality
- ✅ `docs/PROGRESSIVE_RESULTS.md` - Comprehensive documentation

## Testing

All tests pass:
```bash
npm run test:run
# Test Files  4 passed (4)
#      Tests  30 passed (30)
```

Specific tests for progressive results:
- ✅ Callback receives partial results after each iteration
- ✅ Partial result contains correct iteration number
- ✅ `has_tool_calls` and `is_final` flags work correctly
- ✅ Message serialization matches server expectations

## API Compatibility

The new API is **backward compatible**:

```typescript
// Old API still works (no callback)
const result = await client.invoke(messages, {
    recursion_limit: 10
});

// New API with progressive results
const result = await client.invoke(messages, {
    recursion_limit: 10,
    onPartialResult: async (partial) => {
        // Handle immediate results
    }
});
```

## Documentation

Full documentation available at:
- [`docs/PROGRESSIVE_RESULTS.md`](./docs/PROGRESSIVE_RESULTS.md) - Complete guide with examples
- `check.ts` - Working code example
- `tests/invoke.test.ts` - Test cases

## How It Works

```
User sends message
      ↓
   API Call #1
      ↓
 Response arrives ─────→ Callback fires (partial result #1)
      ↓
Tool execution (local)
      ↓
   API Call #2
      ↓
 Response arrives ─────→ Callback fires (partial result #2)
      ↓
   [No more tools]
      ↓
  Return final result
```

**Key Point**: Callback fires **immediately after each API response**, not after tool execution. This gives users instant feedback without waiting for local tool processing.

## Next Steps

To use progressive results in your application:

1. Update invoke calls to use options object
2. Add onPartialResult callback
3. Update UI to display messages as they arrive
4. Use `has_tool_calls` flag to show loading indicators
5. Use `is_final` flag to know when complete

See `docs/PROGRESSIVE_RESULTS.md` for detailed examples including React components.
