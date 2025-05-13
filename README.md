# libranda-client

A robust WebSocket client library for connecting to Libranda Server with built-in reconnection and event management.

[📚 View Full Documentation](./docs.md) | [🚀 View Examples](https://github.com/Randa-Software/libranda-examples) | [🖥️ View Server](https://github.com/Randa-Software/libranda-server)

## Features

- Automatic reconnection handling
- Event-based communication
- Type-safe event system
- Client metadata management
- Connection state tracking
- Namespaced events
- Ready state callbacks

## Installation

```bash
npm install libranda-client
```

## Quick Start

```typescript
import { LibrandaClient } from 'libranda-client';

// Create a client instance
const client = new LibrandaClient({
    url: 'ws://localhost:3000',
    autoReconnect: true,
    reconnectInterval: 5000
});

// Register event handler
client.registerEvent(
    'chat',
    'message',
    (data) => {
        console.log('Received chat message:', data.message);
    }
);

// Connect to server
client.connect();

// Send events when ready
client.ready((clientId) => {
    console.log(`Connected with ID: ${clientId}`);
    client.send('chat', 'message', {
        message: 'Hello, server!'
    });
});
```

## Documentation

For detailed API documentation, advanced usage, and best practices, see the [documentation](./docs.md).

For working examples and sample implementations, visit our [examples repository](https://github.com/Randa-Software/libranda-examples).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
