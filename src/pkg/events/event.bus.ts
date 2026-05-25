import { EventEmitter } from "node:events";

type Handler<T = unknown> = (data: T) => void;

class EventBus extends EventEmitter {
  publish<T>(topic: string, data: T): void {
    this.emit(topic, data);
  }

  subscribe<T>(topic: string, handler: Handler<T>): void {
    this.on(topic, handler as Handler);
  }

  unsubscribe<T>(topic: string, handler: Handler<T>): void {
    this.off(topic, handler as Handler);
  }

  subscribeOnce<T>(topic: string, handler: Handler<T>): void {
    this.once(topic, handler as Handler);
  }
}

export const eventBus = new EventBus();
