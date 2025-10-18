import { Message, RemoteToolCallBlock, ToolResultBlock } from './message.js';

// TOOL HANDLER
export interface ToolHandler {
    (args: any): Promise<any>;
}

export interface ToolParameter {
    type: string;
    properties: Record<string, any>;
    required: string[];
}

export interface Tool {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: ToolParameter;
    };
}

export interface InvokeResponse {
    messages: Message[];
}


export interface ToolDefinition extends ToolHandler {
    name: string;
    description?: string;
    parameters?: ToolParameter;
}

export class ToolExecutor {
    private tools: Map<string, ToolDefinition>;

    constructor(tools: ToolDefinition[] = []) {
        this.tools = new Map<string, ToolDefinition>();
        for (const func of tools) {
            this.tools.set(func.name, func);
        }
    }

    /**
     * Get all tools in OpenAI-compatible format
     */
    all_tools(): Tool[] {
        const openaiTools: Tool[] = [];
        
        for (const [name, func] of this.tools) {
            const tool: Tool = {
                type: "function",
                function: {
                    name: name,
                    description: func.description || `Execute ${name}`,
                    parameters: func.parameters || {
                        type: "object",
                        properties: {},
                        required: []
                    }
                }
            };
            openaiTools.push(tool);
        }
        
        return openaiTools;
    }

    /**
     * Check if the response contains any remote tool calls
     */
    hasToolCalls(response: InvokeResponse): boolean {
        if (!response.messages) return false;
        
        return response.messages.some(msg =>
            msg.content && msg.content.some(block => 
                block.type === 'remote_tool_call'
            )
        );
    }

    /**
     * Extract and execute all tool calls from the response
     * Returns an array of tool result messages
     */
    async executeToolCalls(response: InvokeResponse): Promise<Message[]> {
        const toolCalls: RemoteToolCallBlock[] = [];
        
        // Extract all remote_tool_call blocks from messages
        for (const msg of response.messages) {
            if (msg.content) {
                for (const block of msg.content) {
                    if (block.type === 'remote_tool_call') {
                        toolCalls.push(block as RemoteToolCallBlock);
                    }
                }
            }
        }
        
        const results: Message[] = [];
        
        // Execute each tool call
        for (const call of toolCalls) {
            const toolName = call.name;
            
            if (this.tools.has(toolName)) {
                const tool = this.tools.get(toolName)!;
                
                try {
                    // Execute the tool
                    const result = await tool(call.args);
                    
                    // Create a tool result message
                    const toolResultBlock = new ToolResultBlock({ call_id: call.id, output: result, status: 'completed', is_error: false });
                    
                    results.push(Message.tool_message([toolResultBlock]));
                } catch (error) {
                    // Handle errors
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    
                    const toolResultBlock = new ToolResultBlock({ call_id: call.id, output: { error: errorMessage }, status: 'failed', is_error: true });
                    
                    results.push(Message.tool_message([toolResultBlock]));
                }
            } else {
                // Tool not found error
                const toolResultBlock = new ToolResultBlock({ call_id: call.id, output: { error: `Tool '${toolName}' not found` }, status: 'failed', is_error: true });
                
                results.push(Message.tool_message([toolResultBlock]));
            }
        }
        
        return results;
    }
}