import { Message } from './message.js';

// Define ExecutionMeta interface
interface ExecutionMeta {
  current_node: string;
  step: number;
  interrupt?: {
    node: string;
    reason: string;
    status: string;
    data?: Record<string, any>;
  };
  is_running: boolean;
  is_interrupted: boolean;
  is_stopped_requested: boolean;
}

// Define default ExecutionMeta implementation
class DefaultExecutionMeta implements ExecutionMeta {
  current_node: string = 'START';
  step: number = 0;
  is_running: boolean = true;
  is_interrupted: boolean = false;
  is_stopped_requested: boolean = false;

  interrupt?: {
    node: string;
    reason: string;
    status: string;
    data?: Record<string, any>;
  };
}

// Define AgentState class
export class AgentState {
  context: Message[] = [];
  context_summary: string | null = null;
  execution_meta: ExecutionMeta = new DefaultExecutionMeta();

  constructor(initialData: Partial<Record<string, any>> = {}) {
    Object.assign(this, initialData);
  }
}
