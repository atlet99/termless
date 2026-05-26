/**
 * Copyright 2026 Abdurakhman Rakhmankulov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface NotificationEvent {
  type: string
  timestamp: string
  data: Record<string, unknown>
}

type Listener = (event: NotificationEvent) => void

class EventBus {
  private listeners = new Map<string, Set<Listener>>()

  subscribe(userId: string, listener: Listener): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set())
    }
    const listenerSet = this.listeners.get(userId)
    if (listenerSet) {
      listenerSet.add(listener)
    }

    return () => {
      const userListeners = this.listeners.get(userId)
      if (userListeners) {
        userListeners.delete(listener)
        if (userListeners.size === 0) {
          this.listeners.delete(userId)
        }
      }
    }
  }

  publish(userId: string, event: NotificationEvent): void {
    const userListeners = this.listeners.get(userId)
    if (userListeners) {
      for (const listener of userListeners) {
        listener(event)
      }
    }
  }

  publishAll(event: NotificationEvent): void {
    for (const userListeners of this.listeners.values()) {
      for (const listener of userListeners) {
        listener(event)
      }
    }
  }
}

export const eventBus = new EventBus()
