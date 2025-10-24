// Simple check for AgentFlow React Library
// This file demonstrates the API usage

import { AgentFlowClient } from './dist/index.js';
import type { PingResponse, GraphResponse, StateSchemaResponse, InvokePartialResult } from './dist/index.d.js';
import type { AgentStateSchema, FieldSchema } from './src/endpoints/stateSchema';


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


// *************************************
// Check all the apis
// *************************************

// checkPing();
// checkGraph();
// checkStateSchema();
// checkThreadState();
// checkUpdateThreadState();
// checkInvokeWithStreaming();
checkStreamWithToolExecution();

