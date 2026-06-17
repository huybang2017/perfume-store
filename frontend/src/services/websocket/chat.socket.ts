import { io, Socket } from 'socket.io-client';
import { getOrCreateGuestId } from '@/lib/chat-guest';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

function authPayload() {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;
  if (token) return { token };
  const guestId = getOrCreateGuestId();
  return guestId ? { guestId } : null;
}

export function getChatSocket(): Socket | null {
  const auth = authPayload();
  if (!auth) return null;

  if (socket?.connected) {
    socket.auth = auth;
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(`${WS_URL}/chat`, {
    auth,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}
