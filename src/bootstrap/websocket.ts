import { WebSocket, WebSocketServer } from "ws";
import { logger } from "@/pkg/logger/logger";
import { eventBus } from "@/pkg/events/event.bus";

let wss: WebSocketServer | null = null;

export type ExtendedWebSocket = WebSocket & {
  isAlive: boolean;
  userUID: string;
  topics: Set<string>;
};

interface WSMessage {
  event: string;
  payload: Record<string, unknown>;
}

// topic => subscribed sockets
const topicSubscribers = new Map<string, Set<ExtendedWebSocket>>();

// event bus handler refs per topic, kept so we can unregister them
const topicBusHandlers = new Map<string, (data: unknown) => void>();

function subscribeToTopic(socket: ExtendedWebSocket, topic: string) {
  if (!topicSubscribers.has(topic)) {
    topicSubscribers.set(topic, new Set());

    const handler = (data: unknown) => broadcastToTopic(topic, data);
    topicBusHandlers.set(topic, handler);
    eventBus.subscribe(topic, handler);
  }

  topicSubscribers.get(topic)!.add(socket);
  socket.topics.add(topic);
  send(socket, "subscribed", { topic });
}

function unsubscribeFromTopic(socket: ExtendedWebSocket, topic: string) {
  const subscribers = topicSubscribers.get(topic);
  if (subscribers) {
    subscribers.delete(socket);
    if (subscribers.size === 0) {
      const handler = topicBusHandlers.get(topic);
      if (handler) {
        eventBus.unsubscribe(topic, handler);
        topicBusHandlers.delete(topic);
      }
      topicSubscribers.delete(topic);
    }
  }
  socket.topics.delete(topic);
  send(socket, "unsubscribed", { topic });
}

function broadcastToTopic(topic: string, data: unknown) {
  const subscribers = topicSubscribers.get(topic);
  if (!subscribers) return;

  const message = JSON.stringify({ event: topic, payload: data });
  for (const socket of subscribers) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      subscribers.delete(socket);
    }
  }
}

function cleanupSocket(socket: ExtendedWebSocket) {
  for (const topic of socket.topics) {
    unsubscribeFromTopic(socket, topic);
  }
}

function send(socket: ExtendedWebSocket, event: string, payload: Record<string, unknown>) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ event, payload }));
  }
}

function handleMessage(socket: ExtendedWebSocket, rawData: unknown) {
  let msg: WSMessage;
  try {
    msg = JSON.parse(String(rawData)) as WSMessage;
  } catch {
    send(socket, "error", { message: "Invalid JSON" });
    return;
  }

  switch (msg.event) {
    case "subscribe": {
      const topic = msg.payload.topic;
      if (typeof topic !== "string" || !topic) {
        send(socket, "error", { message: "subscribe requires a topic string" });
        return;
      }
      subscribeToTopic(socket, topic);
      break;
    }
    case "unsubscribe": {
      const topic = msg.payload.topic;
      if (typeof topic !== "string" || !topic) {
        send(socket, "error", { message: "unsubscribe requires a topic string" });
        return;
      }
      unsubscribeFromTopic(socket, topic);
      break;
    }
    default:
      logger.info(`[WS] Unknown event: ${msg.event}`);
  }
}

// initialize web socket server
export function initWebSocket(wsPort: number) {
  if (wss) return wss;

  wss = new WebSocketServer({ port: wsPort });

  wss.on("connection", (socket: ExtendedWebSocket) => {
    logger.info("[WS CONNECTED]: WebSocket client connected");

    socket.isAlive = true;
    socket.topics = new Set();

    socket.on("pong", () => (socket.isAlive = true));

    socket.on("message", (rawData) => handleMessage(socket, rawData));

    socket.on("error", (err) => {
      logger.error(`[WS ERROR]: ${err.message}`);
    });

    socket.on("close", () => {
      cleanupSocket(socket);
      logger.info("[WS CLOSED]: WebSocket client disconnected");
    });
  });

  wss.on("error", (err) => {
    logger.error(`[WSS ERROR]: ${err.message}`);
  });

  const interval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      const socket = ws as ExtendedWebSocket;
      if (!socket.isAlive) return socket.terminate();
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
    wss = null;
  });

  return wss;
}

export function closeWebsocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (wss) {
      wss.close((err) => {
        if (err) {
          logger.error(`[WS]: failed to close ws connection: ${err}`);
          reject(err);
        }
        logger.info("[WS]: Websocket server closed");
        resolve();
      })
    } else {
      resolve();
    }
  })
}

interface ISendPayload {
  event: string;
  payload: Record<string, unknown>;
}

// broadcast ke semua client yang terkoneksi
export function broadcast(payload: ISendPayload) {
  if (!wss) {
    logger.warn("[WARNING]: Attempted to broadcast before initialization");
    return;
  }
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// kirim ke client berdasarkan userUID
export function sendToUser(userUID: string, payload: ISendPayload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    const socket = client as ExtendedWebSocket;
    if (socket.userUID === userUID && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
}

// publish event ke semua client yang subscribe ke topic tersebut
// gunakan ini dari service/controller mana pun
export function publishToTopic(topic: string, data: unknown) {
  eventBus.publish(topic, data);
}
