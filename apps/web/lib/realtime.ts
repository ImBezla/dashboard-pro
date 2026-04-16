import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api-base-url';

const SOCKET_URL = API_BASE_URL;

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (socket) {
    const prev = (socket.auth as { token?: string } | undefined)?.token;
    if (prev !== (token ?? undefined)) {
      socket.disconnect();
      socket = null;
    }
  }
  if (!socket) {
    socket = io(`${SOCKET_URL}/realtime`, {
      transports: ['websocket'],
      auth: { token: token ?? undefined },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

