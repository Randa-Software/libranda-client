interface LibrandaClientOptions {
    url?: string;
    autoReconnect?: boolean;
    reconnectInterval?: number;
}

interface EventMetadata {
    [key: string]: any;
}

interface EventData {
    [key: string]: any;
    metadata?: EventMetadata;
}

interface SystemInitData {
    clientId: string;
}

type EventCallback<T = any> = (data: T) => void;
type UnregisterCallback = () => void;
type ReadyCallback = (clientId: string) => void;

export class LibrandaClient {
    constructor(options?: LibrandaClientOptions);

    connect(): void;
    disconnect(): void;
    registerEvent<T = any>(namespace: string, event: string, callback: EventCallback<T>): UnregisterCallback;
    send(namespace: string, event: string, data?: EventData): void;
    setMetadata(metadata: EventMetadata): void;
    getMetadata(): EventMetadata;
    ready(callback: ReadyCallback): void;
    isConnected(): boolean;
    getId(): string | null;
}