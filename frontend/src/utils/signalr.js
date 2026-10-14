import * as signalR from '@microsoft/signalr';

const HUB_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/hubs/room`
  : 'http://localhost:5163/hubs/room';

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

/**
 * Start the SignalR connection if not already started.
 */
export async function startConnection() {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log('[SignalR] Connected.');
      fallbackPolling = false;
    } catch (err) {
      console.error('[SignalR] Connection failed:', err);
      fallbackPolling = true;
    }
  }
  return conn;
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
