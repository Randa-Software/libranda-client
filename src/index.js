// Determine the environment and get the appropriate WebSocket implementation
let WebSocketImpl;
if (typeof window !== "undefined") {
    WebSocketImpl = WebSocket;
} else {
    const { WebSocket: NodeWebSocket } = await import("ws");
    WebSocketImpl = NodeWebSocket;
}

// Helper function to get the host and protocol
const getDefaultHost = () => {
    if (typeof window !== "undefined") {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        return `${protocol}://${window.location.host}`;
    }
    return "ws://localhost:8080";
};

export class LibrandaClient {
    constructor(options = {}) {
        this.url = options.url || getDefaultHost();
        this.autoReconnect = options.autoReconnect !== false;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.eventHandlers = new Map(); // namespace -> Map(event -> Set(callbacks))
        this.ws = null;
        this.isConnecting = false;
        this.reconnectTimer = null;
        this.clientId = null;
        this.metadata = {};
        this.onReady = null;
        this.plugins = new Map(); // pluginId -> plugin instance
    }

    connect() {
        if (
            this.ws &&
            (this.ws.readyState === WebSocketImpl.CONNECTING ||
                this.ws.readyState === WebSocketImpl.OPEN)
        ) {
            return;
        }

        if (this.isConnecting) {
            return;
        }

        this.isConnecting = true;
        this.ws = new WebSocketImpl(this.url);

        this.ws.onopen = () => {
            this.isConnecting = false;
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this._handleEvent("system", "connected", null);
        };

        this.ws.onclose = () => {
            this.isConnecting = false;
            this.clientId = null;
            this._handleEvent("system", "disconnected", null);
            if (this.autoReconnect) {
                this.reconnectTimer = setTimeout(
                    () => this.connect(),
                    this.reconnectInterval,
                );
            }
        };

        this.ws.onerror = (error) => {
            this._handleEvent("system", "error", error);
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.namespace && message.event) {
                    // Handle system init message that provides client ID
                    if (
                        message.namespace === "system" &&
                        message.event === "init"
                    ) {
                        this.clientId = message.data.clientId;
                        // If there's a ready callback, execute it
                        if (this.onReady) {
                            this.onReady(this.clientId);
                        }
                    }
                    this._handleEvent(
                        message.namespace,
                        message.event,
                        message.data,
                    );
                }
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };
    }

    registerPlugin(plugin) {
        if (!plugin.id) {
            throw new Error("Plugin must have an id property");
        }
        if (this.plugins.has(plugin.id)) {
            throw new Error(
                `Plugin with id ${plugin.id} is already registered`,
            );
        }

        // Create plugin API
        const api = {
            send: (namespace, event, data) => this.send(namespace, event, data),
            registerEvent: (namespace, event, callback) =>
                this.registerEvent(namespace, event, callback),
            getPluginType: () => {
                return "client";
            },
        };

        this.plugins.set(plugin.id, plugin);
        if (typeof plugin.initialize === "function") {
            plugin.initialize(api);
        }

        return () => this.unregisterPlugin(plugin.id);
    }

    unregisterPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            if (typeof plugin.cleanup === "function") {
                try {
                    plugin.cleanup();
                } catch (err) {
                    console.error(`Error cleaning up plugin ${pluginId}:`, err);
                }
            }
            this.plugins.delete(pluginId);
        }
    }

    getPlugins() {
        return Array.from(this.plugins.values());
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.autoReconnect = false;
            this.ws.close();
            this.ws = null;
            this.clientId = null;

            // Clean up plugins
            for (const [pluginId] of this.plugins) {
                this.unregisterPlugin(pluginId);
            }
            this.plugins.clear();
        }
    }

    registerEvent(namespace, event, callback) {
        if (!this.eventHandlers.has(namespace)) {
            this.eventHandlers.set(namespace, new Map());
        }
        const namespaceHandlers = this.eventHandlers.get(namespace);

        if (!namespaceHandlers.has(event)) {
            namespaceHandlers.set(event, new Set());
        }
        const eventCallbacks = namespaceHandlers.get(event);

        eventCallbacks.add(callback);
        return () => eventCallbacks.delete(callback);
    }

    send(namespace, event, data = {}) {
        if (!this.ws || this.ws.readyState !== WebSocketImpl.OPEN) {
            throw new Error("WebSocket is not connected");
        }

        this.ws.send(
            JSON.stringify({
                namespace,
                event,
                data: {
                    ...data,
                    metadata: this.metadata,
                },
            }),
        );
    }

    setMetadata(metadata) {
        this.metadata = { ...this.metadata, ...metadata };
    }

    getMetadata() {
        return { ...this.metadata };
    }

    ready(callback) {
        if (this.clientId) {
            callback(this.clientId);
        } else {
            this.onReady = callback;
        }
    }

    _handleEvent(namespace, event, data) {
        const namespaceHandlers = this.eventHandlers.get(namespace);
        if (!namespaceHandlers) return;

        const eventCallbacks = namespaceHandlers.get(event);
        if (!eventCallbacks) return;

        for (const callback of eventCallbacks) {
            try {
                callback(data);
            } catch (err) {
                console.error(
                    `Error in event handler (${namespace}:${event}):`,
                    err,
                );
            }
        }
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocketImpl.OPEN;
    }

    getId() {
        return this.clientId;
    }
}

// CommonJS module exports
if (typeof module !== "undefined" && module.exports) {
    module.exports = { LibrandaClient };
}
