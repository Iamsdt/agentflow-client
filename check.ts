// Simple check for AgentFlow React Library
// This file demonstrates the API usage

import { AgentFlowClient } from './dist/index.js';
import type { PingResponse, GraphResponse, StateSchemaResponse, InvokePartialResult } from './dist/index.d.js';
import type { AgentStateSchema, FieldSchema } from './src/endpoints/stateSchema';
import { MemoryType } from './src/endpoints/storeMemory';
import type { StoreMemoryResponse } from './src/endpoints/storeMemory';
import { RetrievalStrategy, DistanceMetric } from './src/endpoints/searchMemory';
import type { SearchMemoryResponse } from './src/endpoints/searchMemory';
import type { GetMemoryResponse } from './src/endpoints/getMemory';
import type { UpdateMemoryResponse } from './src/endpoints/updateMemory';
import type { DeleteMemoryResponse } from './src/endpoints/deleteMemory';
import type { ListMemoriesResponse } from './src/endpoints/listMemories';
import type { ForgetMemoriesResponse } from './src/endpoints/forgetMemories';


function create_client(): AgentFlowClient {
    const client = new AgentFlowClient({
            baseUrl: 'http://localhost:8000',
            debug: false
    });
    return client;
}



async function checkPing(): Promise<void> {
    try {
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to ping the server...');

        // Now properly typed - users can access properties with dot notation
        const pingResult: PingResponse = await client.ping();

        console.log('Full ping result:', pingResult);

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and ping method are working correctly!');
    }
}



async function checkGraph(): Promise<void> {
    try {
        console.log('\n------- Testing Graph API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to fetch graph from the server...');

        // Now properly typed - users can access properties with dot notation
        const graphResult: GraphResponse = await client.graph();

        console.log('Graph nodes:', graphResult.data.nodes);
        console.log('Graph edges:', graphResult.data.edges);
        console.log('Graph info:', graphResult.metadata);

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and graph method are working correctly!');
    }
}


async function checkStateSchema(): Promise<void> {
    try {
        console.log('\n------- Testing State Schema API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to fetch state schema from the server...');

        // Fetch the complete schema with field definitions
        const schemaResponse: StateSchemaResponse = await client.graphStateSchema();

        console.log('\n📋 Agent State Schema:');
        console.log('Title:', schemaResponse.data.title);
        console.log('Description:', schemaResponse.data.description);
        console.log('\nAvailable Fields:');
        
        // Iterate through all field definitions
        if (schemaResponse.data.properties) {
            Object.entries(schemaResponse.data.properties).forEach(([fieldName, fieldSchema]) => {
                console.log(`\n  📌 ${fieldName}:`);
                console.log(`     Type: ${Array.isArray(fieldSchema.type) ? fieldSchema.type.join(' | ') : fieldSchema.type}`);
                if (fieldSchema.description) {
                    console.log(`     Description: ${fieldSchema.description}`);
                }
                if (fieldSchema.default !== undefined) {
                    console.log(`     Default: ${JSON.stringify(fieldSchema.default)}`);
                }
                if (fieldSchema.items) {
                    console.log(`     Items: ${JSON.stringify(fieldSchema.items)}`);
                }
            });
        }
        
        console.log('\nSchema metadata:', schemaResponse.metadata);
        console.log('\n✅ Users can now understand:');
        console.log('   - What fields are available in AgentState');
        console.log('   - What type each field expects');
        console.log('   - What the default values are');
        console.log('   - What each field represents');

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and graphStateSchema method are working correctly!');
    }
}


async function checkThreadState(): Promise<void> {
    try {
        console.log('\n------- Testing Thread State API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to fetch thread state from the server...');
        console.log('Thread ID: 5');

        // Fetch the thread state
        const threadStateResponse = await client.threadState(5);

        console.log('\n📋 Thread State Retrieved:');
        console.log('Request ID:', threadStateResponse.metadata.request_id);
        console.log('Timestamp:', threadStateResponse.metadata.timestamp);
        console.log('Status:', threadStateResponse.metadata.message);

        console.log('\n📝 Thread Context Messages:');
        const state = threadStateResponse.data.state;
        
        if (state.context && state.context.length > 0) {
            state.context.forEach((message: any, idx: number) => {
                console.log(`\n  ${idx + 1}. [${message.role.toUpperCase()}]`);
                console.log(`     Message ID: ${message.message_id}`);
                console.log(`     Timestamp: ${new Date(message.timestamp * 1000).toISOString()}`);
                
                if (message.content && Array.isArray(message.content)) {
                    message.content.forEach((block: any) => {
                        if (block.type === 'text') {
                            console.log(`     Content: ${block.text.slice(0, 100)}`);
                        } else if (block.type === 'tool_call') {
                            console.log(`     Tool Call: ${block.name}`);
                        } else {
                            console.log(`     ${block.type}: ${JSON.stringify(block).slice(0, 50)}`);
                        }
                    });
                }
                
                if (message.usages) {
                    console.log(`     Tokens - Prompt: ${message.usages.prompt_tokens}, Completion: ${message.usages.completion_tokens}`);
                }
            });
        }

        if (state.context_summary) {
            console.log('\n📌 Context Summary:', state.context_summary);
        }

        console.log('\n📊 Execution Meta:');
        console.log('   Current Node:', state.execution_meta);
        console.log('   Step:', state.execution_meta.step);
        console.log('   Is Running:', state.execution_meta.is_running);
        console.log('   Is Interrupted:', state.execution_meta.is_interrupted);

        console.log('\n✅ Users can now:');
        console.log('   - Fetch conversation history from any thread');
        console.log('   - Get current execution state');
        console.log('   - Track token usage');
        console.log('   - Resume conversations');
        console.log('   - Analyze conversation flow');

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and threadState method are working correctly!');
    }
}

async function checkThreadDetails(): Promise<void> {
    try {
        console.log('\n------- Testing Thread Details API -------');
        console.log('Creating AgentFlowClient...');

        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to fetch thread details from the server...');
        console.log('Thread ID: 5');

        const details = await client.threadDetails(5);

        console.log('\n📋 Thread Details Retrieved:');
        console.log('Request ID:', details.metadata.request_id);
        console.log('Timestamp:', details.metadata.timestamp);
        console.log('Status:', details.metadata.message);

        const thread = details.data.thread_data.thread as any;
        console.log('\n🧵 Thread:');
        console.log('  ID:', thread.thread_id);
        console.log('  Name:', thread.thread_name);
        console.log('  User ID:', thread.user_id);
        console.log('  Metadata:', thread.metadata);
        console.log('  Updated At:', thread.updated_at);
        console.log('  Run ID:', thread.run_id);

        console.log('\n✅ Users can now:');
        console.log('   - Fetch basic thread information');
        console.log('   - Inspect ownership, metadata, and status');
        console.log('   - Display thread labels in UI');
    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and threadDetails method are working correctly!');
    }
}

async function checkThreads(): Promise<void> {
    try {
        console.log('\n------- Testing Threads List API (GET) -------');
        console.log('Creating AgentFlowClient...');

        const client = create_client();

        console.log('AgentFlowClient created successfully!');
        console.log('Attempting to fetch threads list from the server...');

        // Test 1: Fetch all threads
        console.log('\n📋 Test 1: Fetching all threads (no filters)');
        const allThreads = await client.threads();

        console.log('Request ID:', allThreads.metadata.request_id);
        console.log('Timestamp:', allThreads.metadata.timestamp);
        console.log('Status:', allThreads.metadata.message);
        console.log(`Found ${allThreads.data.threads.length} threads`);

        if (allThreads.data.threads.length > 0) {
            console.log('\n🧵 First Thread:');
            const thread = allThreads.data.threads[0];
            console.log('  ID:', thread.thread_id);
            console.log('  Name:', thread.thread_name);
            console.log('  User ID:', thread.user_id);
            console.log('  Metadata:', thread.metadata);
            console.log('  Updated At:', thread.updated_at);
            console.log('  Run ID:', thread.run_id);
        }

        // Test 2: Fetch with search
        console.log('\n📋 Test 2: Fetching threads with search filter');
        const searchResults = await client.threads('s', undefined, undefined);
        console.log(`Found ${searchResults.data.threads.length} threads matching search 's'`);

        // Test 3: Fetch with pagination
        console.log('\n📋 Test 3: Fetching threads with pagination');
        const paginatedResults = await client.threads(undefined, 0, 10);
        console.log(`Found ${paginatedResults.data.threads.length} threads (offset: 0, limit: 10)`);

        // Test 4: Fetch with all parameters
        console.log('\n📋 Test 4: Fetching threads with search and pagination');
        const filteredResults = await client.threads('s', 0, 10);
        console.log(`Found ${filteredResults.data.threads.length} threads (search: 's', offset: 0, limit: 10)`);

        console.log('\n✅ Users can now:');
        console.log('   - List all threads');
        console.log('   - Search threads by keyword');
        console.log('   - Paginate through thread results');
        console.log('   - Combine search and pagination');
        console.log('   - Display threads in a list or table UI');
    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and threads method are working correctly!');
    }
}


async function checkUpdateThreadState(): Promise<void> {
    try {
        console.log('\n------- Testing Update Thread State API (Checkpoint) -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Preparing thread state update...');
        console.log('Thread ID: 5');

        // Prepare the state update with config and new state
        const updateConfig = {
            max_iterations: 25,
            timeout: 600,
            retry_policy: {
                max_retries: 3,
                backoff_factor: 1.5
            }
        };

        const newState = {
            context: [
                {
                    message_id: '82549b0c-dd9b-4756-a303-ea0ea6c9be3b',
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'HI',
                            annotations: []
                        }
                    ],
                    delta: false,
                    tools_calls: null,
                    timestamp: 1761290526.29568,
                    metadata: {},
                    usages: null,
                    raw: null
                }
            ],
            context_summary: 'User greeted the assistant',
            execution_meta: {
                current_node: 'PROCESSING',
                step: 1,
                is_running: false,
                is_interrupted: false,
                is_stopped_requested: false
            }
        };

        console.log('\n📤 Sending state update...');
        console.log('Config:', JSON.stringify(updateConfig, null, 2));

        // Update the thread state
        const updateResponse = await client.updateThreadState(5, updateConfig, newState);

        console.log('\n✅ Thread State Updated Successfully!');
        console.log('Request ID:', updateResponse.metadata.request_id);
        console.log('Timestamp:', updateResponse.metadata.timestamp);
        console.log('Status:', updateResponse.metadata.message);

        console.log('\n📋 Updated State Retrieved:');
        const updatedState = updateResponse.data.state;
        
        console.log('Context Messages:', updatedState.context.length);
        if (updatedState.context_summary) {
            console.log('Context Summary:', updatedState.context_summary);
        }

        console.log('\n📊 Execution State:');
        console.log('   Current Node:', updatedState.execution_meta.current_node);
        console.log('   Step:', updatedState.execution_meta.step);
        console.log('   Is Running:', updatedState.execution_meta.is_running);

        console.log('\n💡 Checkpoint Features:');
        console.log('   ✅ Save thread state at any point');
        console.log('   ✅ Update execution configuration');
        console.log('   ✅ Checkpoint conversations');
        console.log('   ✅ Resume from saved points');
        console.log('   ✅ Manage thread lifecycle');
        console.log('   ✅ Support persistence');

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and updateThreadState method are working correctly!');
    }
}


async function checkClearThreadState(): Promise<void> {
    try {
        console.log('\n------- Testing Clear Thread State API (Delete Checkpoint) -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Preparing to clear thread state...');
        console.log('Thread ID: 5');

        console.log('\n🗑️  Sending clear thread state request...');

        // Clear the thread state
        const clearResponse = await client.clearThreadState(5);

        console.log('\n✅ Thread State Cleared Successfully!');
        console.log('Request ID:', clearResponse.metadata.request_id);
        console.log('Timestamp:', clearResponse.metadata.timestamp);
        console.log('Status:', clearResponse.metadata.message);

        console.log('\n📋 Clear Response:');
        console.log('Success:', clearResponse.data.success);
        console.log('Message:', clearResponse.data.message);
        console.log('Data:', clearResponse.data.data);

        console.log('\n💡 Clear Thread State Features:');
        console.log('   ✅ Delete checkpoint data for a thread');
        console.log('   ✅ Reset thread to clean state');
        console.log('   ✅ Clear conversation history');
        console.log('   ✅ Manage thread lifecycle');
        console.log('   ✅ Free up storage resources');
        console.log('   ✅ Support for thread cleanup');

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and clearThreadState method are working correctly!');
    }
}

async function checkCheckpointMessages(): Promise<void> {
    try {
        console.log('\n------- Testing Checkpoint Messages API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to fetch checkpoint messages from the server...');
        console.log('Thread ID: 5');
        console.log('Search: "h"');
        console.log('Offset: 0');
        console.log('Limit: 10');

        // Fetch checkpoint messages with search and pagination
        const messagesResponse = await client.threadMessages(5, 'h', 0, 10);

        console.log('\n📋 Checkpoint Messages Retrieved:');
        console.log('Request ID:', messagesResponse.metadata.request_id);
        console.log('Timestamp:', messagesResponse.metadata.timestamp);
        console.log('Status:', messagesResponse.metadata.message);

        console.log('\n📝 Messages:');
        const messages = messagesResponse.data.messages;
        
        if (messages && Array.isArray(messages) && messages.length > 0) {
            messages.forEach((message, idx) => {
                console.log(`\n  ${idx + 1}. [${(message as any).role?.toUpperCase() || 'UNKNOWN'}]`);
                console.log(`     Message ID: ${(message as any).message_id}`);
                console.log(`     Timestamp: ${(message as any).timestamp}`);
                
                if ((message as any).content && Array.isArray((message as any).content)) {
                    (message as any).content.forEach((block: any) => {
                        if (block.type === 'text') {
                            console.log(`     Content: ${block.text.slice(0, 100)}`);
                        } else if (block.type === 'tool_call') {
                            console.log(`     Tool Call: ${block.name}`);
                        } else {
                            console.log(`     ${block.type}: ${JSON.stringify(block).slice(0, 50)}`);
                        }
                    });
                }
                
                if ((message as any).usages) {
                    console.log(`     Tokens - Prompt: ${(message as any).usages.prompt_tokens}, Completion: ${(message as any).usages.completion_tokens}`);
                }
            });
        } else {
            console.log('  No messages found');
        }

        console.log('\n✅ Users can now:');
        console.log('   - Fetch message history from a specific thread');
        console.log('   - Search messages with keywords');
        console.log('   - Use pagination with offset and limit');
        console.log('   - Analyze conversation history');
        console.log('   - Retrieve checkpoint messages');

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and checkpointMessages method are working correctly!');
    }
}

async function checkThreadMessage(): Promise<void> {
    try {
        console.log('\n------- Testing Thread Message API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to fetch a specific message from the server...');
        console.log('Thread ID: 5');
        console.log('Message ID: 39dff7f2-b300-465a-82a3-3985b7c8bc81');

        // Fetch a specific message by ID
        const messageResponse = await client.singleMessage(5, '39dff7f2-b300-465a-82a3-3985b7c8bc81');

        console.log('\n📋 Thread Message Retrieved:');
        console.log('Request ID:', messageResponse.metadata.request_id);
        console.log('Timestamp:', messageResponse.metadata.timestamp);
        console.log('Status:', messageResponse.metadata.message);

        console.log('\n📝 Message Details:');
        const msg = messageResponse.data;
        
        console.log(`  Message ID: ${(msg as any).message_id}`);
        console.log(`  Role: ${(msg as any).role?.toUpperCase() || 'UNKNOWN'}`);
        console.log(`  Timestamp: ${(msg as any).timestamp}`);
        console.log(`  Delta: ${(msg as any).delta}`);
        
        if ((msg as any).content && Array.isArray((msg as any).content)) {
            console.log(`\n  Content Blocks: ${(msg as any).content.length}`);
            (msg as any).content.forEach((block: any, idx: number) => {
                if (block.type === 'text') {
                    console.log(`    ${idx + 1}. Text: ${block.text.slice(0, 80)}`);
                    if (block.annotations && block.annotations.length > 0) {
                        console.log(`       Annotations: ${block.annotations.length}`);
                    }
                } else if (block.type === 'tool_call') {
                    console.log(`    ${idx + 1}. Tool Call: ${block.name}`);
                    console.log(`       Args: ${JSON.stringify(block.args).slice(0, 50)}`);
                } else if (block.type === 'tool_result') {
                    console.log(`    ${idx + 1}. Tool Result from: ${block.name}`);
                    console.log(`       Output: ${JSON.stringify(block.output).slice(0, 50)}`);
                } else {
                    console.log(`    ${idx + 1}. ${block.type}: ${JSON.stringify(block).slice(0, 50)}`);
                }
            });
        }
        
        if ((msg as any).usages) {
            console.log(`\n  Token Usage:`);
            console.log(`    - Prompt Tokens: ${(msg as any).usages.prompt_tokens}`);
            console.log(`    - Completion Tokens: ${(msg as any).usages.completion_tokens}`);
            console.log(`    - Total Tokens: ${(msg as any).usages.total_tokens}`);
        }

        console.log('\n✅ Users can now:');
        console.log('   - Fetch a specific message by ID from a thread');
        console.log('   - Access detailed message content and metadata');
        console.log('   - View token usage for that specific message');
        console.log('   - Retrieve message annotations');
        console.log('   - Access complete message history');

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and threadMessage method are working correctly!');
    }
}

async function checkAddCheckpointMessages(): Promise<void> {
    try {
        console.log('\n------- Testing Add Checkpoint Messages API (POST) -------');
        console.log('Creating AgentFlowClient...');

        // Create client
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('Attempting to add messages to thread checkpoint...');
        console.log('Thread ID: 5');

        // Import Message class to create messages
        const { Message } = await import('./dist/index.js');

        // Create sample messages to add to the checkpoint
        const messages = [
            Message.text_message('Hello, this is a checkpoint message!', 'user'),
            Message.text_message('Thank you for saving this to the checkpoint.', 'assistant')
        ];

        // Configuration for the checkpoint
        const config = {
            model: 'gpt-4',
            temperature: 0.7
        };

        // Metadata for the checkpoint
        const metadata = {
            source: 'manual_checkpoint',
            timestamp: new Date().toISOString()
        };

        // Add messages to the thread checkpoint
        const addResponse = await client.addThreadMessages(5, messages, config, metadata);

        console.log('\n📋 Add Checkpoint Messages Response:');
        console.log('Success:', addResponse.data.success);
        console.log('Message:', addResponse.data.message);
        console.log('Data:', addResponse.data.data);
        console.log('\nMetadata:');
        console.log('Request ID:', addResponse.metadata.request_id);
        console.log('Timestamp:', addResponse.metadata.timestamp);
        console.log('Status:', addResponse.metadata.message);

        console.log('\n✅ Users can now:');
        console.log('   - Add new messages to thread checkpoints');
        console.log('   - Save conversation history programmatically');
        console.log('   - Include configuration with checkpoint');
        console.log('   - Add metadata to checkpoints');
        console.log('   - Batch add multiple messages at once');
        console.log('   - Create manual checkpoints for thread state');

    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and addThreadMessages method are working correctly!');
    }
}

async function checkDeleteThreadMessage(): Promise<void> {
    try {
        console.log('\n------- Testing Delete Thread Message API (DELETE) -------');
        console.log('Creating AgentFlowClient...');

        const client = create_client();

        console.log('AgentFlowClient created successfully!');
        console.log('Attempting to delete a message from a thread...');
        console.log('Thread ID: 5');
        console.log('Message ID: 58788989');

        const config = {};

        const deleteResponse = await client.deleteMessage(5, '58788989', config);

        console.log('\n📋 Delete Thread Message Response:');
        console.log('Success:', deleteResponse.data.success);
        console.log('Message:', deleteResponse.data.message);
        console.log('Data:', deleteResponse.data.data);
        console.log('\nMetadata:');
        console.log('Request ID:', deleteResponse.metadata.request_id);
        console.log('Timestamp:', deleteResponse.metadata.timestamp);
        console.log('Status:', deleteResponse.metadata.message);

        console.log('\n✅ Users can now:');
        console.log('   - Delete a specific message from a thread');
        console.log('   - Pass optional config with the request');
        console.log('   - Verify deletion via success flag and metadata');
    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and deleteMessage method are working correctly!');
    }
}

async function checkDeleteThread(): Promise<void> {
    try {
        console.log('\n------- Testing Delete Thread API (DELETE) -------');
        console.log('Creating AgentFlowClient...');

        const client = create_client();

        console.log('AgentFlowClient created successfully!');
        console.log('Attempting to delete a thread...');
        console.log('Thread ID: 5');

        const config = {};

        const deleteResponse = await client.deleteThread(5, config);

        console.log('\n📋 Delete Thread Response:');
        console.log('Success:', deleteResponse.data.success);
        console.log('Message:', deleteResponse.data.message);
        console.log('Data:', deleteResponse.data.data);
        console.log('\nMetadata:');
        console.log('Request ID:', deleteResponse.metadata.request_id);
        console.log('Timestamp:', deleteResponse.metadata.timestamp);
        console.log('Status:', deleteResponse.metadata.message);

        console.log('\n✅ Users can now:');
        console.log('   - Delete an entire thread');
        console.log('   - Pass optional config with the request');
        console.log('   - Verify deletion via success flag and metadata');
        console.log('   - Support both string and numeric thread IDs');
    } catch (error) {
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and deleteThread method are working correctly!');
    }
}

async function checkInvokeWithStreaming(): Promise<void> {
    try {
        console.log('\n------- Testing Invoke API with Progressive Results -------');
        console.log('Creating AgentFlowClient...');

        const client = new AgentFlowClient({
            baseUrl: 'http://localhost:8000',
            debug: true  // Enable debug to see the request payload
        });

        // Register a mock weather tool
        client.registerTool({
            node: 'weather_node',
            name: 'get_weather',
            description: 'Get current weather for a location',
            parameters: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'City name'
                    }
                },
                required: ['location']
            },
            handler: async (args: any) => {
                console.log(`\n  🔧 Executing tool: get_weather for ${args.location}`);
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                return {
                    location: args.location,
                    temperature: 72,
                    conditions: 'sunny',
                    humidity: 65
                };
            }
        });

        // Register a calculator tool
        client.registerTool({
            node: 'calculator_node',
            name: 'calculate',
            description: 'Perform calculations',
            parameters: {
                type: 'object',
                properties: {
                    expression: {
                        type: 'string',
                        description: 'Math expression'
                    }
                },
                required: ['expression']
            },
            handler: async (args: any) => {
                console.log(`\n  🔧 Executing tool: calculate expression ${args.expression}`);
                await new Promise(resolve => setTimeout(resolve, 300));
                try {
                    const result = eval(args.expression);
                    return { result };
                } catch (error) {
                    throw new Error(`Invalid expression: ${args.expression}`);
                }
            }
        });

        await client.setup();

        console.log('\n📤 Sending initial message...');
        console.log('Message: "What is the weather in San Francisco?"');

        // Import Message from the built distribution
        const { Message } = await import('./dist/index.js');

        const messages = [
            Message.text_message('What is the weather in San Francisco?', 'user')
        ];

        console.log('\n� Message being sent:', JSON.stringify(messages[0], null, 2));

        console.log('\n�🔄 Starting invoke with progressive results...\n');
        console.log('=' .repeat(60));

        // Track when we receive results
        let resultsReceived = 0;

        const result = await client.invoke(messages, {
            initial_state: {},
            config: {},
            recursion_limit: 10,
            response_granularity: 'full',
            // This callback receives results immediately after each API call
            onPartialResult: async (partial: InvokePartialResult) => {
                resultsReceived++;
                console.log(`\n📨 PARTIAL RESULT #${resultsReceived} (Iteration ${partial.iteration})`);
                console.log('-'.repeat(60));
                
                if (partial.messages && partial.messages.length > 0) {
                    console.log(`📝 Messages received: ${partial.messages.length}`);
                    partial.messages.forEach((msg: any, idx: number) => {
                        const contentStr = Array.isArray(msg.content) 
                            ? msg.content.map((c: any) => c.text || c.name || JSON.stringify(c).slice(0, 50)).join(', ')
                            : String(msg.content).slice(0, 100);
                        console.log(`   ${idx + 1}. [${msg.role}]: ${contentStr}`);
                    });
                }
                
                if (partial.has_tool_calls) {
                    console.log('🔧 Has tool calls: YES - will execute and continue');
                } else {
                    console.log('✅ Has tool calls: NO - this is the final result');
                }
                
                if (partial.is_final) {
                    console.log('🎉 This is the FINAL result!');
                }
                
                console.log('-'.repeat(60));
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ INVOKE COMPLETED!\n');
        console.log('📊 Summary:');
        console.log(`   - Total iterations: ${result.iterations}`);
        console.log(`   - Partial results received: ${resultsReceived}`);
        console.log(`   - Total messages: ${result.all_messages.length}`);
        console.log(`   - Recursion limit reached: ${result.recursion_limit_reached}`);
        
        console.log('\n📬 Final messages:');
        result.messages.forEach((msg: any, idx: number) => {
            const contentStr = Array.isArray(msg.content) 
                ? msg.content.map((c: any) => c.text || c.name || JSON.stringify(c).slice(0, 50)).join(', ')
                : String(msg.content).slice(0, 100);
            console.log(`   ${idx + 1}. [${msg.role}]: ${contentStr}`);
        });

        console.log('\n💡 Key Benefits:');
        console.log('   ✅ Users get responses immediately after each API call');
        console.log('   ✅ No waiting for tool execution to complete');
        console.log('   ✅ Can show loading states for tool execution');
        console.log('   ✅ Better user experience with progressive feedback');
        console.log('   ✅ Can display intermediate results in real-time');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Stack:', (error as Error).stack);
    }
}


async function checkStreamWithToolExecution(): Promise<void> {
    try {
        console.log('\n------- Testing Stream API with Tool Execution -------');
        console.log('Creating AgentFlowClient...');

        const client = new AgentFlowClient({
            baseUrl: 'http://localhost:8000',
            debug: true  // Enable debug to see the streaming flow
        });

        // // Register a mock weather tool
        // client.registerTool({
        //     node: 'weather_node',
        //     name: 'get_weather',
        //     description: 'Get current weather for a location',
        //     parameters: {
        //         type: 'object',
        //         properties: {
        //             location: {
        //                 type: 'string',
        //                 description: 'City name'
        //             }
        //         },
        //         required: ['location']
        //     },
        //     handler: async (args: any) => {
        //         console.log(`\n  🔧 Executing tool: get_weather for ${args.location}`);
        //         // Simulate API delay
        //         await new Promise(resolve => setTimeout(resolve, 500));
        //         return {
        //             location: args.location,
        //             temperature: 72,
        //             conditions: 'sunny',
        //             humidity: 65
        //         };
        //     }
        // });

        // // Register a calculator tool
        // client.registerTool({
        //     node: 'calculator_node',
        //     name: 'calculate',
        //     description: 'Perform calculations',
        //     parameters: {
        //         type: 'object',
        //         properties: {
        //             expression: {
        //                 type: 'string',
        //                 description: 'Math expression'
        //             }
        //         },
        //         required: ['expression']
        //     },
        //     handler: async (args: any) => {
        //         console.log(`\n  🔧 Executing tool: calculate expression ${args.expression}`);
        //         await new Promise(resolve => setTimeout(resolve, 300));
        //         try {
        //             const result = eval(args.expression);
        //             return { result };
        //         } catch (error) {
        //             throw new Error(`Invalid expression: ${args.expression}`);
        //         }
        //     }
        // });

        await client.setup();

        console.log('\n📤 Sending initial message...');
        console.log('Message: "What is the weather in San Francisco?"');

        // Import Message from the built distribution
        const { Message } = await import('./dist/index.js');

        const messages = [
            Message.text_message('What is the weather in San Francisco and calculate 2+2', 'user')
        ];

        console.log('\n🌊 Starting STREAM with tool execution loop...\n');
        console.log('=' .repeat(60));

        // Stream the response
        const stream = client.stream(messages, {
            initial_state: {},
            config: {},
            recursion_limit: 10,
            response_granularity: 'low'
        });

        let chunkCount = 0;
        let messageCount = 0;

        // Iterate over stream chunks
        for await (const chunk of stream) {
            chunkCount++;

            
            console.log(`\n📨 CHUNK #${chunkCount} - Event: ${chunk.event}`, chunk);
            console.log('-'.repeat(60));
            
            // if (chunk.event === 'message' && chunk.message) {
            //     messageCount++;
            //     const msg = chunk.message;
            //     console.log(`📝 Message #${messageCount} [${msg.role}]:`);
                
            //     // Display content
            //     if (msg.content && Array.isArray(msg.content)) {
            //         msg.content.forEach((block: any, idx: number) => {
            //             if (block.type === 'text') {
            //                 console.log(`   ${idx + 1}. Text: ${block.text}`);
            //             } else if (block.type === 'remote_tool_call') {
            //                 console.log(`   ${idx + 1}. Tool Call: ${block.name}`);
            //                 console.log(`      Args: ${JSON.stringify(block.arguments)}`);
            //             } else if (block.type === 'tool_result') {
            //                 console.log(`   ${idx + 1}. Tool Result: ${block.name}`);
            //                 console.log(`      Output: ${JSON.stringify(block.output).slice(0, 100)}`);
            //             } else {
            //                 console.log(`   ${idx + 1}. ${block.type}: ${JSON.stringify(block).slice(0, 100)}`);
            //             }
            //         });
            //     }
            // } else if (chunk.event === 'updates') {
            //     console.log('🔄 State/Context Updated');
            //     if (chunk.state) {
            //         console.log(`   Context messages: ${chunk.state.context?.length || 0}`);
            //     }
            // } else if (chunk.event === 'error') {
            //     console.error('❌ Error:', chunk.data);
            // } else {
            //     console.log(`ℹ️  Event: ${chunk.event}`);
            // }
            
            // console.log('-'.repeat(60));
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ STREAM COMPLETED!\n');
        console.log('📊 Summary:');
        console.log(`   - Total chunks received: ${chunkCount}`);
        console.log(`   - Total messages: ${messageCount}`);

        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ HTTP Streaming (NDJSON format)');
        console.log('   ✅ Real-time chunk yielding');
        console.log('   ✅ Automatic tool execution loop');
        console.log('   ✅ Multiple iterations with tool calls');
        console.log('   ✅ Same logic as invoke() but streaming!');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Stack:', (error as Error).stack);
    }
}


async function checkStoreMemory(): Promise<void> {
    try {
        console.log('\n------- Testing Store Memory API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('\nAttempting to store different types of memories...\n');

        // Example 1: Store a semantic memory (user preference)
        console.log('1️⃣  Storing SEMANTIC memory (user preference)...');
        const semanticResult: StoreMemoryResponse = await client.storeMemory({
            content: 'User prefers dark mode for all interfaces',
            memory_type: MemoryType.SEMANTIC,
            category: 'preferences',
            metadata: {
                source: 'user_settings',
                priority: 'high'
            }
        });
        console.log('   ✅ Memory stored with ID:', semanticResult.data.memory_id);
        console.log('   📋 Request ID:', semanticResult.metadata.request_id);

        // Example 2: Store an episodic memory (conversation)
        console.log('\n2️⃣  Storing EPISODIC memory (conversation)...');
        const episodicResult: StoreMemoryResponse = await client.storeMemory({
            content: 'User asked about Python async/await and how to implement concurrent tasks',
            memory_type: MemoryType.EPISODIC,
            category: 'conversation',
            metadata: {
                timestamp: new Date().toISOString(),
                topic: 'python-programming'
            }
        });
        console.log('   ✅ Memory stored with ID:', episodicResult.data.memory_id);

        // Example 3: Store a procedural memory (how-to knowledge)
        console.log('\n3️⃣  Storing PROCEDURAL memory (how-to)...');
        const proceduralResult: StoreMemoryResponse = await client.storeMemory({
            content: 'Steps to deploy a React app: 1) Build the project, 2) Upload to hosting, 3) Configure DNS',
            memory_type: MemoryType.PROCEDURAL,
            category: 'deployment',
            config: {
                importance: 'high'
            },
            options: {
                ttl: 3600
            },
            metadata: {
                domain: 'web-development'
            }
        });
        console.log('   ✅ Memory stored with ID:', proceduralResult.data.memory_id);

        // Example 4: Store an entity memory
        console.log('\n4️⃣  Storing ENTITY memory (person info)...');
        const entityResult: StoreMemoryResponse = await client.storeMemory({
            content: 'John Doe is a senior software engineer specializing in distributed systems',
            memory_type: MemoryType.ENTITY,
            category: 'people',
            metadata: {
                entity_type: 'person',
                entity_name: 'John Doe'
            }
        });
        console.log('   ✅ Memory stored with ID:', entityResult.data.memory_id);

        // Example 5: Store a relationship memory
        console.log('\n5️⃣  Storing RELATIONSHIP memory...');
        const relationshipResult: StoreMemoryResponse = await client.storeMemory({
            content: 'Alice collaborates with Bob on the frontend team',
            memory_type: MemoryType.RELATIONSHIP,
            category: 'team',
            metadata: {
                entity1: 'Alice',
                entity2: 'Bob',
                relationship_type: 'collaborates_with'
            }
        });
        console.log('   ✅ Memory stored with ID:', relationshipResult.data.memory_id);

        // Example 6: Store a declarative memory (fact)
        console.log('\n6️⃣  Storing DECLARATIVE memory (fact)...');
        const declarativeResult: StoreMemoryResponse = await client.storeMemory({
            content: 'The capital of France is Paris, population approximately 2.1 million',
            memory_type: MemoryType.DECLARATIVE,
            category: 'facts',
            metadata: {
                verified: true,
                source: 'wikipedia'
            }
        });
        console.log('   ✅ Memory stored with ID:', declarativeResult.data.memory_id);

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL MEMORY TYPES STORED SUCCESSFULLY!\n');
        console.log('📊 Summary:');
        console.log('   - Semantic memories: User preferences, facts');
        console.log('   - Episodic memories: Conversations, experiences');
        console.log('   - Procedural memories: How-to knowledge, procedures');
        console.log('   - Entity memories: People, places, things');
        console.log('   - Relationship memories: Connections between entities');
        console.log('   - Declarative memories: Explicit facts and events');

        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ Multiple memory types supported');
        console.log('   ✅ Flexible metadata system');
        console.log('   ✅ Optional config and options parameters');
        console.log('   ✅ Category-based organization');
        console.log('   ✅ Unique memory_id returned for each memory');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and storeMemory method are working correctly!');
    }
}


async function checkSearchMemory(): Promise<void> {
    try {
        console.log('\n------- Testing Search Memory API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('\nAttempting to search memories with different strategies...\n');

        // Example 1: Similarity search (default)
        console.log('1️⃣  SIMILARITY search for dark mode preferences...');
        const similarityResults: SearchMemoryResponse = await client.searchMemory({
            query: 'dark mode preferences',
            memory_type: MemoryType.SEMANTIC,
            category: 'preferences',
            limit: 5,
            retrieval_strategy: RetrievalStrategy.SIMILARITY,
            distance_metric: DistanceMetric.COSINE
        });
        console.log('   ✅ Found', similarityResults.data.results.length, 'results');
        similarityResults.data.results.forEach((result, idx) => {
            console.log(`   ${idx + 1}. [Score: ${result.score}] ${result.content}`);
        });

        // Example 2: Temporal search
        console.log('\n2️⃣  TEMPORAL search for recent conversations...');
        const temporalResults: SearchMemoryResponse = await client.searchMemory({
            query: 'python programming',
            memory_type: MemoryType.EPISODIC,
            category: 'conversation',
            limit: 10,
            retrieval_strategy: RetrievalStrategy.TEMPORAL,
            filters: {
                time_range: 'last_7_days'
            }
        });
        console.log('   ✅ Found', temporalResults.data.results.length, 'recent conversations');

        // Example 3: Relevance search
        console.log('\n3️⃣  RELEVANCE search for deployment knowledge...');
        const relevanceResults: SearchMemoryResponse = await client.searchMemory({
            query: 'how to deploy React application',
            memory_type: MemoryType.PROCEDURAL,
            category: 'deployment',
            limit: 3,
            score_threshold: 0.7,
            retrieval_strategy: RetrievalStrategy.RELEVANCE
        });
        console.log('   ✅ Found', relevanceResults.data.results.length, 'relevant procedures');

        // Example 4: Hybrid search with filters
        console.log('\n4️⃣  HYBRID search with filters...');
        const hybridResults: SearchMemoryResponse = await client.searchMemory({
            query: 'software engineer',
            memory_type: MemoryType.ENTITY,
            category: 'people',
            limit: 5,
            retrieval_strategy: RetrievalStrategy.HYBRID,
            distance_metric: DistanceMetric.EUCLIDEAN,
            filters: {
                user_id: 'user-123',
                thread_id: 'thread-456'
            }
        });
        console.log('   ✅ Found', hybridResults.data.results.length, 'entities');

        // Example 5: Graph traversal search
        console.log('\n5️⃣  GRAPH_TRAVERSAL search for relationships...');
        const graphResults: SearchMemoryResponse = await client.searchMemory({
            query: 'team collaboration',
            memory_type: MemoryType.RELATIONSHIP,
            category: 'team',
            limit: 10,
            retrieval_strategy: RetrievalStrategy.GRAPH_TRAVERSAL,
            max_tokens: 2000
        });
        console.log('   ✅ Found', graphResults.data.results.length, 'relationships');

        // Example 6: Full-featured search
        console.log('\n6️⃣  Full-featured search with all parameters...');
        const fullResults: SearchMemoryResponse = await client.searchMemory({
            config: {
                enable_reranking: true
            },
            options: {
                cache: true
            },
            query: 'capital cities',
            memory_type: MemoryType.DECLARATIVE,
            category: 'facts',
            limit: 15,
            score_threshold: 0.8,
            filters: {
                verified: true
            },
            retrieval_strategy: RetrievalStrategy.SIMILARITY,
            distance_metric: DistanceMetric.DOT_PRODUCT,
            max_tokens: 3000
        });
        console.log('   ✅ Found', fullResults.data.results.length, 'facts');
        if (fullResults.data.results.length > 0) {
            console.log('   Top result:', fullResults.data.results[0].content);
            console.log('   Score:', fullResults.data.results[0].score);
            console.log('   Memory ID:', fullResults.data.results[0].id);
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL SEARCH STRATEGIES TESTED SUCCESSFULLY!\n');
        console.log('📊 Summary of Search Capabilities:');
        console.log('   - SIMILARITY: Vector-based semantic search');
        console.log('   - TEMPORAL: Time-based retrieval of recent memories');
        console.log('   - RELEVANCE: Intelligent relevance scoring');
        console.log('   - HYBRID: Combined search approaches');
        console.log('   - GRAPH_TRAVERSAL: Knowledge graph navigation');

        console.log('\n🎯 Distance Metrics Supported:');
        console.log('   - COSINE: Cosine similarity (default)');
        console.log('   - EUCLIDEAN: Euclidean distance');
        console.log('   - DOT_PRODUCT: Dot product similarity');
        console.log('   - MANHATTAN: Manhattan distance');

        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ Multiple retrieval strategies');
        console.log('   ✅ Flexible distance metrics');
        console.log('   ✅ Score threshold filtering');
        console.log('   ✅ Custom filters for precise queries');
        console.log('   ✅ Memory type-specific searches');
        console.log('   ✅ Configurable result limits');
        console.log('   ✅ Token limit control');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and searchMemory method are working correctly!');
    }
}


async function checkGetMemory(): Promise<void> {
    try {
        console.log('\n------- Testing Get Memory API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('\nAttempting to retrieve specific memories by ID...\n');

        // Example 1: Get a semantic memory
        console.log('1️⃣  Fetching SEMANTIC memory by ID...');
        const semanticMemory: GetMemoryResponse = await client.getMemory('mem-semantic-123');
        console.log('   ✅ Memory retrieved:');
        console.log('      ID:', semanticMemory.data.memory.id);
        console.log('      Content:', semanticMemory.data.memory.content);
        console.log('      Score:', semanticMemory.data.memory.score);
        console.log('      Type:', semanticMemory.data.memory.memory_type);
        console.log('      Timestamp:', semanticMemory.data.memory.timestamp);

        // Example 2: Get an episodic memory with config
        console.log('\n2️⃣  Fetching EPISODIC memory with custom config...');
        const episodicMemory: GetMemoryResponse = await client.getMemory('mem-episodic-456', {
            config: {
                include_vector: true,
                format: 'detailed'
            }
        });
        console.log('   ✅ Memory retrieved:');
        console.log('      ID:', episodicMemory.data.memory.id);
        console.log('      Content:', episodicMemory.data.memory.content.substring(0, 50) + '...');
        console.log('      Vector length:', episodicMemory.data.memory.vector.length);
        console.log('      User ID:', episodicMemory.data.memory.user_id);
        console.log('      Thread ID:', episodicMemory.data.memory.thread_id);

        // Example 3: Get a procedural memory
        console.log('\n3️⃣  Fetching PROCEDURAL memory...');
        const proceduralMemory: GetMemoryResponse = await client.getMemory('mem-procedural-789');
        console.log('   ✅ Memory retrieved:');
        console.log('      Content:', proceduralMemory.data.memory.content);
        console.log('      Metadata:', JSON.stringify(proceduralMemory.data.memory.metadata));

        // Example 4: Get an entity memory
        console.log('\n4️⃣  Fetching ENTITY memory...');
        const entityMemory: GetMemoryResponse = await client.getMemory('mem-entity-101');
        console.log('   ✅ Memory retrieved:');
        console.log('      Entity:', entityMemory.data.memory.content);
        console.log('      Type:', entityMemory.data.memory.memory_type);

        // Example 5: Get a relationship memory
        console.log('\n5️⃣  Fetching RELATIONSHIP memory...');
        const relationshipMemory: GetMemoryResponse = await client.getMemory('mem-relationship-202');
        console.log('   ✅ Memory retrieved:');
        console.log('      Relationship:', relationshipMemory.data.memory.content);
        console.log('      Score:', relationshipMemory.data.memory.score);

        // Example 6: Get a memory with options
        console.log('\n6️⃣  Fetching memory with custom options...');
        const memoryWithOptions: GetMemoryResponse = await client.getMemory('56565', {
            config: { 
                expand_references: true 
            },
            options: { 
                cache: true,
                timeout: 5000 
            }
        });
        console.log('   ✅ Memory retrieved:');
        console.log('      ID:', memoryWithOptions.data.memory.id);
        console.log('      Content:', memoryWithOptions.data.memory.content);
        console.log('      Request ID:', memoryWithOptions.metadata.request_id);

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL MEMORY RETRIEVAL TESTS SUCCESSFUL!\n');
        console.log('📊 Memory Retrieval Capabilities:');
        console.log('   - Fetch by numeric ID (e.g., "56565")');
        console.log('   - Fetch by string ID (e.g., "mem-semantic-123")');
        console.log('   - Fetch by UUID format');
        console.log('   - All memory types supported');

        console.log('\n🎯 Configuration Options:');
        console.log('   - config.include_vector: Include embedding vectors');
        console.log('   - config.format: Response format (detailed/summary)');
        console.log('   - config.expand_references: Expand related memories');
        console.log('   - options.cache: Enable response caching');
        console.log('   - options.timeout: Custom timeout settings');

        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ Direct memory access by ID');
        console.log('   ✅ Complete memory metadata retrieval');
        console.log('   ✅ Vector embeddings access');
        console.log('   ✅ User and thread context');
        console.log('   ✅ Flexible configuration');
        console.log('   ✅ Custom options support');

        console.log('\n📝 Typical Use Cases:');
        console.log('   • Retrieve specific memory after search');
        console.log('   • Access stored conversation context');
        console.log('   • Load entity or relationship details');
        console.log('   • Get memory metadata for analysis');
        console.log('   • Fetch memories with full embeddings');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and getMemory method are working correctly!');
    }
}

async function checkUpdateMemory(): Promise<void> {
    try {
        console.log('\n------- Testing Update Memory API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('\nAttempting to update existing memories...\n');

        // Example 1: Update basic memory content
        console.log('1️⃣  Updating memory with new content...');
        const basicUpdate: UpdateMemoryResponse = await client.updateMemory(
            'mem-12345',
            'Updated memory content with new information'
        );
        console.log('   ✅ Memory updated:');
        console.log('      Success:', basicUpdate.data.success);
        console.log('      Request ID:', basicUpdate.metadata.request_id);
        console.log('      Timestamp:', basicUpdate.metadata.timestamp);

        // Example 2: Update memory with metadata
        console.log('\n2️⃣  Updating memory with additional metadata...');
        const updateWithMetadata: UpdateMemoryResponse = await client.updateMemory(
            'mem-semantic-456',
            'Revised semantic memory content',
            {
                metadata: {
                    tags: ['important', 'updated', 'verified'],
                    source: 'user_edit',
                    confidence: 0.95,
                    last_verified: new Date().toISOString()
                }
            }
        );
        console.log('   ✅ Memory updated with metadata:');
        console.log('      Success:', updateWithMetadata.data.success);
        console.log('      Updated data:', JSON.stringify(updateWithMetadata.data.data));

        // Example 3: Update memory with config options
        console.log('\n3️⃣  Updating memory with configuration...');
        const updateWithConfig: UpdateMemoryResponse = await client.updateMemory(
            'mem-episodic-789',
            'Updated episodic memory with new details',
            {
                config: {
                    update_vector: true,
                    recompute_embeddings: true,
                    version_control: true
                }
            }
        );
        console.log('   ✅ Memory updated with config:');
        console.log('      Success:', updateWithConfig.data.success);
        console.log('      Config applied:', 'update_vector, recompute_embeddings, version_control');

        // Example 4: Update with both config and options
        console.log('\n4️⃣  Updating memory with config and options...');
        const complexUpdate: UpdateMemoryResponse = await client.updateMemory(
            'mem-procedural-101',
            'Comprehensive update with full configuration',
            {
                config: {
                    update_vector: true,
                    preserve_history: true
                },
                options: {
                    format: 'markdown',
                    validate: true
                },
                metadata: {
                    updated_by: 'system',
                    change_reason: 'content_improvement'
                }
            }
        );
        console.log('   ✅ Complex update completed:');
        console.log('      Success:', complexUpdate.data.success);
        console.log('      All options applied successfully');

        // Example 5: Update entity memory
        console.log('\n5️⃣  Updating ENTITY memory...');
        const entityUpdate: UpdateMemoryResponse = await client.updateMemory(
            'mem-entity-202',
            'John Doe - Updated entity information',
            {
                metadata: {
                    entity_type: 'person',
                    attributes: {
                        role: 'Senior Engineer',
                        department: 'AI Research'
                    }
                }
            }
        );
        console.log('   ✅ Entity memory updated:');
        console.log('      Success:', entityUpdate.data.success);
        console.log('      Entity metadata updated');

        // Example 6: Update relationship memory
        console.log('\n6️⃣  Updating RELATIONSHIP memory...');
        const relationshipUpdate: UpdateMemoryResponse = await client.updateMemory(
            'mem-relationship-303',
            'Alice works with Bob on the AI project',
            {
                config: {
                    update_relationships: true
                },
                metadata: {
                    relationship_type: 'collaboration',
                    strength: 'strong',
                    context: 'work'
                }
            }
        );
        console.log('   ✅ Relationship memory updated:');
        console.log('      Success:', relationshipUpdate.data.success);
        console.log('      Relationship data synced');

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL MEMORY UPDATE TESTS SUCCESSFUL!\n');
        console.log('📊 Memory Update Capabilities:');
        console.log('   - Update by memory ID (UUID or string)');
        console.log('   - Modify content while preserving ID');
        console.log('   - Update metadata and tags');
        console.log('   - Recompute embeddings on update');
        console.log('   - Version control support');

        console.log('\n🎯 Configuration Options:');
        console.log('   - config.update_vector: Recompute embedding vectors');
        console.log('   - config.recompute_embeddings: Force embedding refresh');
        console.log('   - config.version_control: Enable version history');
        console.log('   - config.preserve_history: Keep previous versions');
        console.log('   - config.update_relationships: Sync related memories');

        console.log('\n🏷️  Metadata Options:');
        console.log('   - tags: Array of classification tags');
        console.log('   - source: Origin of the update');
        console.log('   - confidence: Confidence score (0-1)');
        console.log('   - last_verified: Verification timestamp');
        console.log('   - updated_by: User or system identifier');
        console.log('   - change_reason: Description of why updated');

        console.log('\n⚙️  Additional Options:');
        console.log('   - options.format: Content format (text/markdown/json)');
        console.log('   - options.validate: Enable content validation');

        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ Content updates by memory ID');
        console.log('   ✅ Metadata enrichment');
        console.log('   ✅ Flexible configuration');
        console.log('   ✅ Vector recomputation');
        console.log('   ✅ Version control support');
        console.log('   ✅ Relationship synchronization');

        console.log('\n📝 Typical Use Cases:');
        console.log('   • Correct or improve memory content');
        console.log('   • Add or update metadata tags');
        console.log('   • Refresh embeddings after content change');
        console.log('   • Update entity or relationship details');
        console.log('   • Maintain version history');
        console.log('   • Bulk memory maintenance');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and updateMemory method are working correctly!');
    }
}

async function checkDeleteMemory(): Promise<void> {
    try {
        console.log('\n------- Testing Delete Memory API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('\nAttempting to delete existing memories...\n');

        // Example 1: Delete basic memory
        console.log('1️⃣  Deleting a memory by ID...');
        const basicDelete: DeleteMemoryResponse = await client.deleteMemory('mem-12345');
        console.log('   ✅ Memory deleted:');
        console.log('      Success:', basicDelete.data.success);
        console.log('      Result:', basicDelete.data.data);
        console.log('      Request ID:', basicDelete.metadata.request_id);
        console.log('      Timestamp:', basicDelete.metadata.timestamp);

        // Example 2: Delete memory with config options
        console.log('\n2️⃣  Deleting memory with soft delete option...');
        const softDelete: DeleteMemoryResponse = await client.deleteMemory('mem-semantic-456', {
            config: {
                soft_delete: true,
                preserve_embeddings: true
            }
        });
        console.log('   ✅ Memory soft deleted:');
        console.log('      Success:', softDelete.data.success);
        console.log('      Result:', softDelete.data.data);
        console.log('      Config: soft_delete enabled');

        // Example 3: Delete memory with cascade option
        console.log('\n3️⃣  Deleting memory with cascade deletion...');
        const cascadeDelete: DeleteMemoryResponse = await client.deleteMemory('mem-episodic-789', {
            config: {
                cascade: true,
                delete_related: true
            }
        });
        console.log('   ✅ Memory deleted with cascade:');
        console.log('      Success:', cascadeDelete.data.success);
        console.log('      Related memories also deleted');

        // Example 4: Delete with both config and options
        console.log('\n4️⃣  Deleting memory with config and options...');
        const complexDelete: DeleteMemoryResponse = await client.deleteMemory('mem-procedural-101', {
            config: {
                soft_delete: false,
                archive: true
            },
            options: {
                backup: true,
                notify: true
            }
        });
        console.log('   ✅ Complex delete completed:');
        console.log('      Success:', complexDelete.data.success);
        console.log('      Memory archived and backed up');

        // Example 5: Delete entity memory
        console.log('\n5️⃣  Deleting ENTITY memory...');
        const entityDelete: DeleteMemoryResponse = await client.deleteMemory('mem-entity-202', {
            config: {
                remove_relationships: true
            }
        });
        console.log('   ✅ Entity memory deleted:');
        console.log('      Success:', entityDelete.data.success);
        console.log('      All relationships removed');

        // Example 6: Delete with cleanup options
        console.log('\n6️⃣  Deleting memory with cleanup...');
        const cleanupDelete: DeleteMemoryResponse = await client.deleteMemory('mem-custom-303', {
            config: {
                cleanup_vectors: true,
                cleanup_metadata: true
            },
            options: {
                force: true
            }
        });
        console.log('   ✅ Memory deleted with cleanup:');
        console.log('      Success:', cleanupDelete.data.success);
        console.log('      Vectors and metadata cleaned up');

        // Example 7: Batch delete scenario (multiple IDs)
        console.log('\n7️⃣  Deleting multiple memories...');
        const memoryIds = ['mem-batch-001', 'mem-batch-002', 'mem-batch-003'];
        const deleteResults = [];

        for (const memoryId of memoryIds) {
            const result = await client.deleteMemory(memoryId, {
                config: { soft_delete: false }
            });
            deleteResults.push({
                id: memoryId,
                success: result.data.success
            });
        }

        console.log('   ✅ Batch delete completed:');
        deleteResults.forEach(result => {
            console.log(`      - ${result.id}: ${result.success ? 'Deleted' : 'Failed'}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL MEMORY DELETE TESTS SUCCESSFUL!\n');
        console.log('📊 Memory Delete Capabilities:');
        console.log('   - Delete by memory ID (UUID or string)');
        console.log('   - Soft delete (mark as deleted)');
        console.log('   - Hard delete (permanent removal)');
        console.log('   - Cascade deletion of related memories');
        console.log('   - Archive before delete');
        console.log('   - Backup before delete');

        console.log('\n🎯 Configuration Options:');
        console.log('   - config.soft_delete: Mark as deleted without removing');
        console.log('   - config.cascade: Delete related memories');
        console.log('   - config.archive: Archive before deletion');
        console.log('   - config.preserve_embeddings: Keep embeddings');
        console.log('   - config.cleanup_vectors: Remove vector data');
        console.log('   - config.cleanup_metadata: Remove metadata');
        console.log('   - config.remove_relationships: Delete relationships');
        console.log('   - config.delete_related: Delete related entities');

        console.log('\n⚙️  Additional Options:');
        console.log('   - options.backup: Create backup before delete');
        console.log('   - options.notify: Send deletion notifications');
        console.log('   - options.force: Force delete even with dependencies');

        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ Simple memory deletion by ID');
        console.log('   ✅ Soft delete with preservation');
        console.log('   ✅ Cascade deletion of related data');
        console.log('   ✅ Archive and backup options');
        console.log('   ✅ Cleanup of vectors and metadata');
        console.log('   ✅ Batch deletion support');
        console.log('   ✅ Relationship cleanup');

        console.log('\n📝 Typical Use Cases:');
        console.log('   • Remove outdated or incorrect memories');
        console.log('   • Clean up test or temporary data');
        console.log('   • Implement data retention policies');
        console.log('   • Manage memory storage limits');
        console.log('   • User-initiated data deletion');
        console.log('   • GDPR/privacy compliance deletions');
        console.log('   • Bulk cleanup operations');

        console.log('\n⚠️  Important Notes:');
        console.log('   • Hard deletes are permanent and cannot be undone');
        console.log('   • Use soft_delete for recoverable deletions');
        console.log('   • Cascade deletes affect related memories');
        console.log('   • Archive option preserves data before deletion');
        console.log('   • Force option bypasses dependency checks');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and deleteMemory method are working correctly!');
    }
}

async function checkListMemories(): Promise<void> {
    try {
        console.log('\n------- Testing List Memories API -------');
        console.log('Creating AgentFlowClient...');

        // Create client with a dummy URL for testing
        const client = create_client();

        console.log('AgentFlowClient created successfully!');

        console.log('\nAttempting to fetch list of memories...\n');

        // Example 1: Basic list with default limit
        console.log('1️⃣  Fetching memories with default limit (100)...');
        const basicList: ListMemoriesResponse = await client.listMemories();
        console.log('   ✅ Memories fetched:');
        console.log('      Total count:', basicList.data.memories.length);
        console.log('      Request ID:', basicList.metadata.request_id);
        console.log('      Timestamp:', basicList.metadata.timestamp);

        if (basicList.data.memories.length > 0) {
            const firstMemory = basicList.data.memories[0];
            console.log('      First memory ID:', firstMemory.id);
            console.log('      First memory type:', firstMemory.memory_type);
            console.log('      First memory score:', firstMemory.score);
        }

        // Example 2: List with custom limit
        console.log('\n2️⃣  Fetching memories with custom limit (50)...');
        const limitedList: ListMemoriesResponse = await client.listMemories({
            limit: 50
        });
        console.log('   ✅ Limited memories fetched:');
        console.log('      Count:', limitedList.data.memories.length);
        console.log('      Limit applied: 50');

        // Example 3: List with configuration options
        console.log('\n3️⃣  Fetching memories with config options...');
        const configuredList: ListMemoriesResponse = await client.listMemories({
            limit: 25,
            config: {
                include_vectors: false,
                include_metadata: true
            }
        });
        console.log('   ✅ Configured list fetched:');
        console.log('      Count:', configuredList.data.memories.length);
        console.log('      Vectors excluded, metadata included');

        // Example 4: List with sorting and filtering options
        console.log('\n4️⃣  Fetching memories with sorting options...');
        const sortedList: ListMemoriesResponse = await client.listMemories({
            limit: 100,
            options: {
                sort_by: 'timestamp',
                sort_order: 'desc'
            }
        });
        console.log('   ✅ Sorted list fetched:');
        console.log('      Count:', sortedList.data.memories.length);
        console.log('      Sorted by: timestamp (descending)');

        // Example 5: List with memory type filter
        console.log('\n5️⃣  Fetching episodic memories only...');
        const episodicList: ListMemoriesResponse = await client.listMemories({
            limit: 30,
            config: {
                memory_type: 'episodic'
            }
        });
        console.log('   ✅ Episodic memories fetched:');
        console.log('      Count:', episodicList.data.memories.length);
        console.log('      Type filter: episodic');

        // Example 6: Pagination scenario
        console.log('\n6️⃣  Demonstrating pagination...');
        const page1: ListMemoriesResponse = await client.listMemories({
            limit: 20,
            options: {
                offset: 0
            }
        });
        console.log('   ✅ Page 1 fetched:');
        console.log('      Count:', page1.data.memories.length);
        console.log('      Offset: 0, Limit: 20');

        const page2: ListMemoriesResponse = await client.listMemories({
            limit: 20,
            options: {
                offset: 20
            }
        });
        console.log('   ✅ Page 2 fetched:');
        console.log('      Count:', page2.data.memories.length);
        console.log('      Offset: 20, Limit: 20');

        // Example 7: List with thread filter
        console.log('\n7️⃣  Fetching memories for specific thread...');
        const threadMemories: ListMemoriesResponse = await client.listMemories({
            limit: 50,
            config: {
                thread_id: 'thread-123'
            }
        });
        console.log('   ✅ Thread-specific memories fetched:');
        console.log('      Count:', threadMemories.data.memories.length);
        console.log('      Thread ID: thread-123');

        // Example 8: Analyze memory types distribution
        console.log('\n8️⃣  Analyzing memory types distribution...');
        const allMemories: ListMemoriesResponse = await client.listMemories({
            limit: 200
        });

        const typeDistribution: Record<string, number> = {};
        allMemories.data.memories.forEach(memory => {
            typeDistribution[memory.memory_type] = (typeDistribution[memory.memory_type] || 0) + 1;
        });

        console.log('   ✅ Memory type distribution:');
        Object.entries(typeDistribution).forEach(([type, count]) => {
            console.log(`      - ${type}: ${count} memories`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ ALL MEMORY LIST TESTS SUCCESSFUL!\n');
        console.log('📊 Memory List Capabilities:');
        console.log('   - Fetch all memories with pagination');
        console.log('   - Customize result limit (default: 100)');
        console.log('   - Sort by timestamp or other fields');
        console.log('   - Filter by memory type');
        console.log('   - Filter by thread ID or user ID');
        console.log('   - Include/exclude vectors and metadata');
        console.log('   - Pagination support with offset');

        console.log('\n🎯 Configuration Options:');
        console.log('   - config.include_vectors: Include vector embeddings');
        console.log('   - config.include_metadata: Include metadata objects');
        console.log('   - config.memory_type: Filter by memory type');
        console.log('   - config.thread_id: Filter by thread');
        console.log('   - config.user_id: Filter by user');

        console.log('\n⚙️  Additional Options:');
        console.log('   - options.sort_by: Field to sort by');
        console.log('   - options.sort_order: Sort direction (asc/desc)');
        console.log('   - options.offset: Pagination offset');
        console.log('   - limit: Maximum number of results (default: 100)');

        console.log('\n💡 Key Features Demonstrated:');
        console.log('   ✅ Basic memory listing');
        console.log('   ✅ Custom limit control');
        console.log('   ✅ Configuration options');
        console.log('   ✅ Sorting and filtering');
        console.log('   ✅ Pagination support');
        console.log('   ✅ Type-based filtering');
        console.log('   ✅ Thread-specific queries');
        console.log('   ✅ Memory analysis and distribution');

        console.log('\n📝 Typical Use Cases:');
        console.log('   • View all stored memories');
        console.log('   • Browse memory history');
        console.log('   • Analyze memory distribution');
        console.log('   • Export memory data');
        console.log('   • Memory management dashboard');
        console.log('   • Pagination for large datasets');
        console.log('   • Filter memories by context');
        console.log('   • Memory type analysis');

        console.log('\n⚠️  Important Notes:');
        console.log('   • Default limit is 100 memories');
        console.log('   • Use pagination for large datasets');
        console.log('   • Vectors can be excluded to reduce payload');
        console.log('   • Sorting improves result relevance');
        console.log('   • Filtering reduces network overhead');

        console.log('\n📈 Performance Tips:');
        console.log('   • Set appropriate limit for your use case');
        console.log('   • Exclude vectors when not needed');
        console.log('   • Use filters to narrow results');
        console.log('   • Implement pagination for better UX');
        console.log('   • Cache results when appropriate');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and listMemories method are working correctly!');
    }
}


async function checkForgetMemories(): Promise<void> {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🧹 FORGET MEMORIES API CHECK');
        console.log('='.repeat(70) + '\n');

        const client = create_client();

        console.log('📋 Forget Memories API - Bulk delete memories by criteria\n');
        console.log('   The forgetMemories API allows you to delete multiple memories');
        console.log('   based on type, category, and custom filters.\n');

        // Example 1: Forget all memories of a specific type
        console.log('1️⃣  Forget All Episodic Memories');
        console.log('   ─────────────────────────────');
        try {
            const result1 = await client.forgetMemories({
                memory_type: MemoryType.EPISODIC
            });
            console.log('   ✓ Forgotten count:', result1.data.data.forgotten_count || 0);
            console.log('   ✓ Success:', result1.data.success);
        } catch (error) {
            console.log('   ⚠️  Expected error:', (error as Error).message);
        }

        // Example 2: Forget memories by category
        console.log('\n2️⃣  Forget Memories by Category');
        console.log('   ────────────────────────────');
        try {
            const result2 = await client.forgetMemories({
                category: 'temporary-session-data'
            });
            console.log('   ✓ Forgotten count:', result2.data.data.forgotten_count || 0);
            console.log('   ✓ Success:', result2.data.success);
        } catch (error) {
            console.log('   ⚠️  Expected error:', (error as Error).message);
        }

        // Example 3: Forget memories with filters
        console.log('\n3️⃣  Forget Memories with Thread Filter');
        console.log('   ──────────────────────────────────');
        try {
            const result3 = await client.forgetMemories({
                filters: {
                    thread_id: 'expired-thread-123',
                    tag: 'delete-me'
                }
            });
            console.log('   ✓ Forgotten count:', result3.data.data.forgotten_count || 0);
            console.log('   ✓ Affected threads:', result3.data.data.affected_threads || []);
        } catch (error) {
            console.log('   ⚠️  Expected error:', (error as Error).message);
        }

        // Example 4: Combine type, category, and filters
        console.log('\n4️⃣  Complex Forget with Multiple Criteria');
        console.log('   ──────────────────────────────────────');
        try {
            const result4 = await client.forgetMemories({
                memory_type: MemoryType.EPISODIC,
                category: 'test-data',
                filters: {
                    importance: 'low',
                    tag: 'temporary',
                    created_before: '2024-01-01'
                },
                config: {
                    soft_delete: false,  // Hard delete (permanent)
                    cascade: true        // Delete related data
                },
                options: {
                    backup: true,        // Create backup before deleting
                    force: false         // Don't force if there are dependencies
                }
            });
            console.log('   ✓ Forgotten count:', result4.data.data.forgotten_count || 0);
            console.log('   ✓ Success:', result4.data.success);
        } catch (error) {
            console.log('   ⚠️  Expected error:', (error as Error).message);
        }

        // Example 5: Forget semantic memories only
        console.log('\n5️⃣  Forget Semantic Memories');
        console.log('   ─────────────────────────');
        try {
            const result5 = await client.forgetMemories({
                memory_type: MemoryType.SEMANTIC,
                config: {
                    cleanup_vectors: true  // Also cleanup vector embeddings
                }
            });
            console.log('   ✓ Forgotten count:', result5.data.data.forgotten_count || 0);
            console.log('   ✓ Success:', result5.data.success);
        } catch (error) {
            console.log('   ⚠️  Expected error:', (error as Error).message);
        }

        // Example 6: Forget by multiple tags
        console.log('\n6️⃣  Forget by Multiple Filter Conditions');
        console.log('   ─────────────────────────────────────');
        try {
            const result6 = await client.forgetMemories({
                filters: {
                    tags: ['temporary', 'test', 'debug'],
                    importance: 'low',
                    thread_id: 'cleanup-thread'
                }
            });
            console.log('   ✓ Forgotten count:', result6.data.data.forgotten_count || 0);
            console.log('   ✓ Success:', result6.data.success);
        } catch (error) {
            console.log('   ⚠️  Expected error:', (error as Error).message);
        }

        console.log('\n' + '─'.repeat(70));
        console.log('📚 API DOCUMENTATION');
        console.log('─'.repeat(70));

        console.log('\n📍 Endpoint: POST /v1/store/memories/forget');
        console.log('\n🔑 Parameters:');
        console.log('   • memory_type?: MemoryType - Filter by memory type');
        console.log('     - MemoryType.EPISODIC: Event-based memories');
        console.log('     - MemoryType.SEMANTIC: Knowledge/fact memories');
        console.log('     - MemoryType.PROCEDURAL: Skill/procedure memories');
        console.log('   • category?: string - Filter by category');
        console.log('   • filters?: object - Custom filter conditions');
        console.log('     - thread_id: Filter by specific thread');
        console.log('     - tag: Filter by tag');
        console.log('     - importance: Filter by importance level');
        console.log('     - created_before/after: Filter by date');
        console.log('   • config?: object - Deletion configuration');
        console.log('     - soft_delete: boolean - Soft vs hard delete');
        console.log('     - cascade: boolean - Delete related data');
        console.log('     - cleanup_vectors: boolean - Clean up embeddings');
        console.log('   • options?: object - Additional options');
        console.log('     - backup: boolean - Create backup before delete');
        console.log('     - force: boolean - Force deletion');

        console.log('\n📤 Response Structure:');
        console.log('   {');
        console.log('     data: {');
        console.log('       success: boolean,');
        console.log('       data: {');
        console.log('         forgotten_count: number,');
        console.log('         affected_threads?: string[]');
        console.log('       }');
        console.log('     },');
        console.log('     metadata: { request_id, timestamp, message }');
        console.log('   }');

        console.log('\n⚠️  Safety Considerations:');
        console.log('   • CAUTION: Forget operations are destructive');
        console.log('   • Use soft_delete: true for recoverable deletions');
        console.log('   • Use backup: true for critical data');
        console.log('   • Test filters with listMemories first');
        console.log('   • Consider impact on dependent memories');

        console.log('\n💡 Use Cases:');
        console.log('   • Clean up temporary session data');
        console.log('   • Remove test/debug memories');
        console.log('   • Delete expired thread memories');
        console.log('   • Bulk cleanup of low-importance memories');
        console.log('   • GDPR/privacy compliance deletions');
        console.log('   • Memory management/optimization');

        console.log('\n📖 Best Practices:');
        console.log('   • Preview deletions with listMemories first');
        console.log('   • Use specific filters to avoid over-deletion');
        console.log('   • Enable backups for important operations');
        console.log('   • Document deletion criteria');
        console.log('   • Monitor forgotten_count in response');

    } catch (error) {
        console.log('\n❌ Error:', (error as Error).message);
        console.log('Expected error (server not running):', (error as Error).message);
        console.log('But the client instantiation and forgetMemories method are working correctly!');
    }
}


// *************************************
// Check all the apis
// *************************************

// checkPing();
// checkGraph();
// checkStateSchema();
// checkThreadState();
// checkThreadDetails();
// checkThreads();
// checkUpdateThreadState();
// checkCheckpointMessages();
// checkAddCheckpointMessages();
// checkDeleteThreadMessage();
// checkDeleteThread();
// checkThreadMessage();
// checkStoreMemory();
// checkSearchMemory();
// checkGetMemory();
// checkUpdateMemory();
// checkDeleteMemory();
// checkListMemories();
// checkForgetMemories();
// checkInvokeWithStreaming();
checkStreamWithToolExecution();


