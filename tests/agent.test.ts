import { describe, it, expect } from 'vitest';
import { AgentState } from '../src/agent';
import { Message } from '../src/message';

describe('AgentState', () => {
  describe('constructor', () => {
    it('should create an empty AgentState with default values', () => {
      const state = new AgentState();
      
      expect(state.context).toEqual([]);
      expect(state.context_summary).toBeNull();
      expect(state.execution_meta).toBeDefined();
      expect(state.execution_meta.current_node).toBe('START');
      expect(state.execution_meta.step).toBe(0);
      expect(state.execution_meta.is_running).toBe(true);
      expect(state.execution_meta.is_interrupted).toBe(false);
      expect(state.execution_meta.is_stopped_requested).toBe(false);
    });

    it('should create AgentState with partial data', () => {
      const message = Message.text_message('Hello', 'user');
      const state = new AgentState({
        context: [message],
        context_summary: 'Test summary'
      });
      
      expect(state.context).toHaveLength(1);
      expect(state.context[0]).toBe(message);
      expect(state.context_summary).toBe('Test summary');
    });

    it('should create AgentState with custom execution_meta', () => {
      const state = new AgentState({
        execution_meta: {
          current_node: 'processing',
          step: 5,
          is_running: false,
          is_interrupted: true,
          is_stopped_requested: false
        }
      });
      
      expect(state.execution_meta.current_node).toBe('processing');
      expect(state.execution_meta.step).toBe(5);
      expect(state.execution_meta.is_running).toBe(false);
      expect(state.execution_meta.is_interrupted).toBe(true);
    });

    it('should handle interrupt data in execution_meta', () => {
      const state = new AgentState({
        execution_meta: {
          current_node: 'interrupted_node',
          step: 3,
          is_running: false,
          is_interrupted: true,
          is_stopped_requested: false,
          interrupt: {
            node: 'human_feedback',
            reason: 'User approval required',
            status: 'pending',
            data: { question: 'Proceed?' }
          }
        }
      });
      
      expect(state.execution_meta.interrupt).toBeDefined();
      expect(state.execution_meta.interrupt?.node).toBe('human_feedback');
      expect(state.execution_meta.interrupt?.reason).toBe('User approval required');
      expect(state.execution_meta.interrupt?.status).toBe('pending');
      expect(state.execution_meta.interrupt?.data).toEqual({ question: 'Proceed?' });
    });

    it('should allow multiple messages in context', () => {
      const messages = [
        Message.text_message('Message 1', 'user'),
        Message.text_message('Message 2', 'assistant'),
        Message.text_message('Message 3', 'user')
      ];
      
      const state = new AgentState({ context: messages });
      
      expect(state.context).toHaveLength(3);
      expect(state.context[0].text()).toBe('Message 1');
      expect(state.context[1].text()).toBe('Message 2');
      expect(state.context[2].text()).toBe('Message 3');
    });

    it('should handle complex state updates', () => {
      const state = new AgentState();
      
      // Update state
      state.context.push(Message.text_message('New message', 'user'));
      state.context_summary = 'Updated summary';
      state.execution_meta.step = 10;
      state.execution_meta.current_node = 'final';
      
      expect(state.context).toHaveLength(1);
      expect(state.context_summary).toBe('Updated summary');
      expect(state.execution_meta.step).toBe(10);
      expect(state.execution_meta.current_node).toBe('final');
    });

    it('should handle arbitrary additional properties', () => {
      const state = new AgentState({
        context: [],
        custom_field: 'custom_value',
        another_field: 123
      });
      
      expect((state as any).custom_field).toBe('custom_value');
      expect((state as any).another_field).toBe(123);
    });
  });
});
