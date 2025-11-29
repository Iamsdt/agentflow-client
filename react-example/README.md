# AgentFlow React Example

A simple React chat application demonstrating how to use the AgentFlow client library.

## Prerequisites

- Node.js 18+
- An AgentFlow server running on `localhost:8000`

## Setup

1. Install dependencies:

```bash
cd react-example
npm install
```

2. Make sure your AgentFlow server is running on `http://localhost:8000`

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Features

- **Real-time Chat**: Send messages and receive responses from the AgentFlow agent
- **Streaming Support**: Toggle between streaming and non-streaming modes
- **Connection Status**: Visual indicator showing server connectivity
- **Modern UI**: Clean, dark-themed chat interface

## How it Works

This example uses the `AgentFlowClient` from the `@10xscale/agentflow-client` package:

```javascript
import { AgentFlowClient, Message } from '@10xscale/agentflow-client'

// Create client
const client = new AgentFlowClient({
  baseUrl: 'http://localhost:8000',
  debug: true
})

// Send a message (non-streaming)
const message = Message.text_message('Hello!', 'user')
const result = await client.invoke([message])

// Send a message (streaming)
const stream = client.stream([message])
for await (const chunk of stream) {
  console.log(chunk)
}
```

## Project Structure

```
react-example/
├── index.html          # HTML entry point
├── package.json        # Project dependencies
├── vite.config.js      # Vite configuration
└── src/
    ├── main.jsx        # React entry point
    ├── App.jsx         # Main chat component
    ├── App.css         # Component styles
    └── index.css       # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
