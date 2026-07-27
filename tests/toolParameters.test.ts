import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentFlowClient } from '../src/client';
import { ToolExecutor } from '../src/tools';
import type { RemoteTool } from '../src/endpoints/setupGraph';

const fetchMock = vi.fn();
global.fetch = fetchMock;

function okResponse() {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue({
      data: { success: true, message: 'ok' },
      metadata: { request_id: 'r', timestamp: 't', message: 'OK' },
    }),
  };
}

/** Read back the tools array that setup() actually put on the wire. */
function sentTools(): RemoteTool[] {
  const body = fetchMock.mock.calls[0][1].body as string;
  return JSON.parse(body).tools;
}

describe('ToolParameter optionality', () => {
  let client: AgentFlowClient;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(okResponse());
    client = new AgentFlowClient({ baseUrl: 'http://localhost:8000' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerTool accepts partial JSON Schema', () => {
    it('accepts parameters without `required` when every argument is optional', async () => {
      client.registerTool({
        node: 'tools',
        name: 'read_terminal',
        description: 'Read recent terminal output.',
        parameters: {
          type: 'object',
          properties: {
            last_chars: { type: 'integer', description: 'Default 2000.' },
          },
        },
        handler: async () => 'output',
      });

      await client.setup();

      expect(sentTools()[0].parameters).toEqual({
        type: 'object',
        properties: { last_chars: { type: 'integer', description: 'Default 2000.' } },
        required: [],
      });
    });

    it('accepts parameters without `properties` for a tool that takes no arguments', async () => {
      client.registerTool({
        node: 'tools',
        name: 'read_diff',
        parameters: { type: 'object' },
        handler: async () => 'diff',
      });

      await client.setup();

      expect(sentTools()[0].parameters).toEqual({
        type: 'object',
        properties: {},
        required: [],
      });
    });
  });

  describe('setup() serialization', () => {
    it('preserves an explicit `required` list', async () => {
      client.registerTool({
        node: 'tools',
        name: 'get_weather',
        parameters: {
          type: 'object',
          properties: { location: { type: 'string' } },
          required: ['location'],
        },
        handler: async () => 'sunny',
      });

      await client.setup();

      expect(sentTools()[0].parameters).toEqual({
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location'],
      });
    });

    it('sends a valid empty object schema when `parameters` is omitted entirely', async () => {
      client.registerTool({
        node: 'tools',
        name: 'list_files',
        handler: async () => [],
      });

      await client.setup();

      expect(sentTools()[0].parameters).toEqual({
        type: 'object',
        properties: {},
        required: [],
      });
    });

    it('preserves extra JSON Schema keywords alongside the defaults', async () => {
      client.registerTool({
        node: 'tools',
        name: 'strict_tool',
        parameters: {
          type: 'object',
          properties: { a: { type: 'string' } },
          additionalProperties: false,
        },
        handler: async () => null,
      });

      await client.setup();

      expect(sentTools()[0].parameters).toEqual({
        type: 'object',
        properties: { a: { type: 'string' } },
        required: [],
        additionalProperties: false,
      });
    });
  });

  describe('ToolExecutor.all_tools()', () => {
    it('fills in `required` and `properties` when a registered tool omits them', () => {
      const executor = new ToolExecutor();
      executor.registerTool({
        node: 'tools',
        name: 'read_problems',
        description: 'Read diagnostics.',
        parameters: { type: 'object' },
        handler: async () => [],
      });

      expect(executor.all_tools()[0].function.parameters).toEqual({
        type: 'object',
        properties: {},
        required: [],
      });
    });
  });
});
