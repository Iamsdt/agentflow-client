# Copilot Instructions for agentflow-client

## Project Overview
- **agentflow-client** is a TypeScript client library for integrating with the AgentFlow API, designed for use in any JavaScript/TypeScript application.
- The core client is `AgentFlowClient` (`src/client/client.ts`), which manages API communication, authentication, timeouts, and debug logging.
- Tooling for remote function execution is abstracted via `ToolExecutor` and related types in `src/tools.ts`.
- Endpoints are organized under `src/client/endpoints/`, e.g., `ping.ts` implements the `/v1/ping` API call.

## Key Architectural Patterns
- **Client Construction:**
  - Instantiate `AgentFlowClient` with an `AgentFlowConfig` object specifying `baseUrl`, optional `authToken`, `timeout`, and `debug`.
  - Example:
    ```ts
    const client = new AgentFlowClient({ baseUrl: 'https://api.example.com', authToken: 'token', debug: true });
    ```
- **Endpoint Calls:**
  - Methods like `ping()` delegate to endpoint modules (e.g., `ping.ts`) and pass a context object.
  - All API calls support debug logging and request timeouts.
- **Tool Execution:**
  - Tools are defined as `ToolDefinition` objects and managed by `ToolExecutor`.
  - Tool execution is asynchronous and results are wrapped in `ToolResultBlock` messages.
  - Tools are compatible with OpenAI-style function-calling schemas.

## Developer Workflows
- **Build:**
  - Run `npm run build` or `npm run dev` (watch mode). Output is in `dist/`.
- **Type Checking:**
  - TypeScript strict mode is enabled. All code must type-check.
- **No Tests:**
  - No test scripts or test files are present as of this writing.

## Project Conventions
- **TypeScript Only:**
  - All source code is in TypeScript, using ES modules.
- **Framework Agnostic:**
  - The library can be used in any JavaScript/TypeScript environment (React, Vue, Node.js, etc.).
- **Error Handling:**
  - API errors and timeouts are surfaced as thrown exceptions with debug logging if enabled.
- **Extensibility:**
  - New endpoints should be added under `src/client/endpoints/` and exposed via methods on `AgentFlowClient`.
  - New tools should implement `ToolDefinition` and be registered with `ToolExecutor`.

## Integration Points
- **External Dependencies:**
  - Depends on `react` (peer), and uses the Fetch API for HTTP requests.
- **API Versioning:**
  - Endpoint URLs are versioned (e.g., `/v1/ping`).

## Example File Map
- `src/client/client.ts`: Main API client
- `src/client/endpoints/ping.ts`: Example endpoint implementation
- `src/tools.ts`: Tool execution and type definitions

---

For questions about project structure or conventions, review the files above or ask for clarification.
