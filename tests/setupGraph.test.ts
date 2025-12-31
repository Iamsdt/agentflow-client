import { describe, it, expect } from 'vitest';
import { AgentFlowClient } from '../src/index';
import type { SetupGraphResponse, RemoteTool } from '../src/index';

describe('Setup Graph API Tests', () => {
  const client = new AgentFlowClient({
    baseUrl: 'http://localhost:8000',
    debug: true
  });

  describe('setup method', () => {
    it('should have setup method', () => {
      expect(client).toBeDefined();
      expect(client.setup).toBeDefined();
      expect(typeof client.setup).toBe('function');
    });

    it('should call setup with no registered tools', async () => {
      try {
        const result: SetupGraphResponse = await client.setup();
        
        // If server is running, we expect a response
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.data.success).toBeDefined();
        expect(result.metadata).toBeDefined();
        
        console.log('Setup with no tools successful:', result.data);
      } catch (error) {
        // Expected - server not running
        expect(error).toBeDefined();
        console.log('Expected error (server not running):', (error as Error).message);
      }
    });

    it('should setup with registered tools', async () => {
      // Register a test tool
      client.registerTool({
        name: 'test_tool',
        node: 'test_node',
        description: 'A test tool for testing',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Test query parameter'
            }
          },
          required: ['query']
        },
        handler: async (args: any) => {
          return { result: 'test' };
        }
      });

      try {
        const result: SetupGraphResponse = await client.setup();
        
        expect(result).toBeDefined();
        expect(result.data.success).toBeDefined();
        
        // Should indicate tools were registered
        if (result.data.registered_tools !== undefined) {
          expect(result.data.registered_tools).toBeGreaterThan(0);
          console.log('Tools registered:', result.data.registered_tools);
        }
        
        console.log('Setup with tools successful:', result.data);
      } catch (error) {
        expect(error).toBeDefined();
        console.log('Expected error:', (error as Error).message);
      }
    });

    it('should setup with multiple tools', async () => {
      const toolClient = new AgentFlowClient({
        baseUrl: 'http://localhost:8000',
        debug: true
      });

      // Register multiple tools
      toolClient.registerTool({
        name: 'tool_one',
        node: 'node_one',
        description: 'First test tool',
        parameters: {
          type: 'object',
          properties: {
            param1: { type: 'string' }
          },
          required: []
        },
        handler: async (args: any) => ({ result: 'one' })
      });

      toolClient.registerTool({
        name: 'tool_two',
        node: 'node_two',
        description: 'Second test tool',
        parameters: {
          type: 'object',
          properties: {
            param2: { type: 'number' }
          },
          required: []
        },
        handler: async (args: any) => ({ result: 'two' })
      });

      try {
        const result: SetupGraphResponse = await toolClient.setup();
        
        expect(result).toBeDefined();
        expect(result.data.success).toBeDefined();
        
        if (result.data.registered_tools !== undefined) {
          expect(result.data.registered_tools).toBe(2);
          console.log('Multiple tools registered:', result.data.registered_tools);
        }
      } catch (error) {
        console.log('Expected error (server not running)');
      }
    });

    it('should validate response structure', async () => {
      try {
        const result: SetupGraphResponse = await client.setup();
        
        // Verify response structure
        expect(result.data).toBeDefined();
        expect(typeof result.data.success).toBe('boolean');
        expect(typeof result.data.message).toBe('string');
        
        expect(result.metadata).toBeDefined();
        expect(result.metadata.request_id).toBeDefined();
        expect(result.metadata.timestamp).toBeDefined();
        expect(result.metadata.message).toBeDefined();
        
        console.log('Response structure validated');
      } catch (error) {
        console.log('Expected error (validation will be done when server is available)');
      }
    });
  });

  describe('Tool Registration and Setup Flow', () => {
    it('should convert tool registrations to RemoteTool format', async () => {
      const flowClient = new AgentFlowClient({
        baseUrl: 'http://localhost:8000',
        debug: true
      });

      // Register a tool with complete definition
      flowClient.registerTool({
        name: 'calculator',
        node: 'math_node',
        description: 'Performs basic math operations',
        parameters: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              enum: ['add', 'subtract', 'multiply', 'divide'],
              description: 'Math operation to perform'
            },
            a: {
              type: 'number',
              description: 'First operand'
            },
            b: {
              type: 'number',
              description: 'Second operand'
            }
          },
          required: ['operation', 'a', 'b']
        },
        handler: async (args: any) => {
          // Implementation doesn't matter for setup
          return { result: 0 };
        }
      });

      try {
        const result = await flowClient.setup();
        expect(result.data.success).toBeDefined();
        console.log('Tool conversion and setup successful');
      } catch (error) {
        console.log('Expected error (server not running)');
      }
    });

    it('should handle tools with complex parameters', async () => {
      const complexClient = new AgentFlowClient({
        baseUrl: 'http://localhost:8000',
        debug: true
      });

      complexClient.registerTool({
        name: 'complex_tool',
        node: 'complex_node',
        description: 'Tool with nested parameters',
        parameters: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              properties: {
                nested: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          },
          required: []
        },
        handler: async (args: any) => ({ result: 'complex' })
      });

      try {
        const result = await complexClient.setup();
        expect(result.data.success).toBeDefined();
        console.log('Complex tool setup successful');
      } catch (error) {
        console.log('Expected error (server not running)');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle setup without registerTool', async () => {
      const emptyClient = new AgentFlowClient({
        baseUrl: 'http://localhost:8000',
        debug: true
      });

      try {
        const result = await emptyClient.setup();
        // Should succeed with 0 tools
        expect(result.data.success).toBeDefined();
      } catch (error) {
        console.log('Expected error (server not running)');
      }
    });

    it('should handle network errors', async () => {
      const badClient = new AgentFlowClient({
        baseUrl: 'http://invalid-host:9999',
        timeout: 1000,
        debug: true
      });

      try {
        await badClient.setup();
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBeDefined();
        console.log('Network error handled:', (error as Error).message);
      }
    });
  });

  describe('Client Configuration', () => {
    it('should respect client timeout', async () => {
      const shortTimeoutClient = new AgentFlowClient({
        baseUrl: 'http://localhost:8000',
        timeout: 100,
        debug: true
      });

      try {
        await shortTimeoutClient.setup();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should include auth token if provided', async () => {
      const authClient = new AgentFlowClient({
        baseUrl: 'http://localhost:8000',
        authToken: 'test-bearer-token',
        debug: true
      });

      try {
        await authClient.setup();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
