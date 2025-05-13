# Libranda Client Technical Documentation

## Architecture Overview

Libranda Client provides a WebSocket-based communication library for connecting to Libranda Server. It offers event-based messaging, automatic reconnection, and metadata management capabilities.

## Core Components

### Connection Management

#### Client Configuration
```typescript
interface LibrandaClientOptions {
    url?: string;
    autoReconnect?: boolean;
    reconnectInterval?: number;
}
```
Controls the client's connection behavior and WebSocket endpoint configuration.

#### Connection Lifecycle
```typescript
connect(): void
disconnect(): void
isConnected(): boolean
```
Manages the WebSocket connection lifecycle. The connect operation initiates the WebSocket connection and sets up event handlers.

### Event System

#### Event Registration
```typescript
registerEvent<T>(
    namespace: string,
    event: string,
    callback: (data: T) => void
): () => void
```
- **namespace**: Logical grouping for related events
- **event**: Specific event identifier
- **callback**: Handler function receiving typed event data
- **returns**: Cleanup function to unregister the handler

#### Event Sending
```typescript
send(namespace: string, event: string, data?: EventData): void
```
Sends an event to the server with optional data and metadata.

### Client Identity

#### Client ID Management
```typescript
getId(): string | null
ready(callback: (clientId: string) => void): void
```
Manages client identification and provides initialization callbacks.

### Metadata Management

#### Client Metadata
```typescript
setMetadata(metadata: EventMetadata): void
getMetadata(): EventMetadata
```
Manages arbitrary metadata that gets sent with each event.

## System Events

### Built-in Events

1. **system:connected**
   - Triggered when WebSocket connection is established
   - No data payload

2. **system:disconnected**
   - Triggered when WebSocket connection is lost
   - No data payload

3. **system:error**
   - Triggered on WebSocket errors
   - Data contains error information

4. **system:init**
   - Triggered when server assigns client ID
   - Data contains `{ clientId: string }`

## Best Practices

### Connection Management
- Initialize client early in application lifecycle
- Use autoReconnect for resilient connections
- Handle connection state changes

### Event Handling
1. Use typed event registration for type safety
2. Clean up event listeners when no longer needed
3. Handle connection state in critical operations

### Metadata Usage
- Keep metadata lightweight
- Update metadata when relevant data changes
- Use structured formats for consistency

## Type Safety

### Generic Event Handling
```typescript
// Type-safe event registration
client.registerEvent<ChatMessage>(
    'chat',
    'message',
    (data: ChatMessage) => {
        console.log(data.content);
    }
);

interface ChatMessage {
    content: string;
    timestamp: number;
}
```

### Metadata Types
```typescript
interface EventMetadata {
    userId?: string;
    sessionId?: string;
    [key: string]: any;
}
```

## Error Handling

### Common Scenarios

1. **Connection Failures**
   ```typescript
   client.registerEvent('system', 'error', (error) => {
       console.error('Connection error:', error);
       // Implement recovery logic
   });
   ```

2. **Send During Disconnect**
   ```typescript
   try {
       client.send('chat', 'message', data);
   } catch (error) {
       // Handle disconnected state
   }
   ```

### Best Practices
1. Always check connection state before critical operations
2. Implement error boundaries for event handlers
3. Use ready callback for initialization logic

## Performance Considerations

### Event Management
- Clean up unused event listeners
- Avoid excessive event registration
- Batch related data changes

### Connection Handling
- Set appropriate reconnection intervals
- Handle reconnection backoff
- Monitor connection health

### Metadata Optimization
- Minimize metadata size
- Update metadata efficiently
- Remove unnecessary metadata

## API Type Reference

```typescript
type EventCallback<T = any> = (data: T) => void;
type UnregisterCallback = () => void;
type ReadyCallback = (clientId: string) => void;

interface EventData {
    [key: string]: any;
    metadata?: EventMetadata;
}

interface SystemInitData {
    clientId: string;
}
```

## Security Considerations

1. **Connection Security**
   - Use WSS for production
   - Validate server certificates
   - Implement proper authentication

2. **Data Protection**
   - Sanitize event data
   - Protect sensitive metadata
   - Handle errors securely

3. **Best Practices**
   - Never send credentials in clear text
   - Validate server responses
   - Implement request timeouts

## Troubleshooting

### Common Issues

1. **Connection Problems**
   - Verify server URL
   - Check network connectivity
   - Confirm WebSocket support

2. **Event Handling Issues**
   - Verify event registration
   - Check namespace and event names
   - Monitor callback execution

3. **Metadata Problems**
   - Validate metadata format
   - Check metadata size
   - Verify metadata updates

### Debug Strategies
1. Enable browser WebSocket debugging
2. Monitor network traffic
3. Implement logging for critical operations