import * as signalR from '@microsoft/signalr';
import { API_URL } from '../api';

const HUB_URL = `${API_URL}/hubs/room`;

let connection = null;
let fallbackPolling = false;

/**
 * Get or create the SignalR connection.
 * JWT token is read from localStorage on each connection attempt.
 */
export function getConnection() {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('cp_token') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.onreconnecting((error) => {
    console.warn('[SignalR] Reconnecting...', error);
    fallbackPolling = false;
  });

  connection.onreconnected((connectionId) => {
    console.log('[SignalR] Reconnected:', connectionId);
    fallbackPolling = false;
  });

  connection.onclose((error) => {
    console.error('[SignalR] Connection closed.', error);
    fallbackPolling = true;
    connection = null;
  });

  return connection;
}

let startPromise = null;

/**
 * Start the SignalR connection, or wait for a start that is already in progress.
 * Throws if the connection cannot be established.
 */
export async function startConnection() {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Connected) return conn;
  if (conn.state === signalR.HubConnectionState.Disconnected && !startPromise) {
    startPromise = conn
      .start()
      .then(() => {
        console.log('[SignalR] Connected.');
        fallbackPolling = false;
      })
      .catch((err) => {
        console.error('[SignalR] Connection failed:', err);
        fallbackPolling = true;
        throw err;
      })
      .finally(() => {
        startPromise = null;
      });
  }
  if (startPromise) await startPromise;
  return conn;
}

/**
 * Join a room's real-time group and attach event handlers.
 * Returns a cleanup function that detaches exactly these handlers and leaves the room,
 * so it can be returned straight from a useEffect.
 */
export function subscribeToRoom(roomId, handlers, { onError } = {}) {
  let cancelled = false;
  let conn = null;

  (async () => {
    try {
      const c = await startConnection();
      if (cancelled) return;
      conn = c;
      Object.entries(handlers).forEach(([event, handler]) => c.on(event, handler));
      await c.invoke('JoinRoom', roomId);
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  })();

  return () => {
    cancelled = true;
    if (!conn) return;
    Object.entries(handlers).forEach(([event, handler]) => conn.off(event, handler));
    conn.invoke('LeaveRoom', roomId).catch(() => {});
  };
}

/**
 * Stop the connection gracefully.
 */
export async function stopConnection() {
  if (connection) {
    try {
      await connection.stop();
    } catch (err) {
      console.warn('[SignalR] Stop error:', err);
    }
    connection = null;
  }
  fallbackPolling = false;
}

/**
 * Whether the client should fall back to REST polling (every 10s).
 */
export function isFallbackPolling() {
  return fallbackPolling;
}

/**
 * Check if the connection is currently active.
 */
export function isConnected() {
  return connection?.state === signalR.HubConnectionState.Connected;
}
