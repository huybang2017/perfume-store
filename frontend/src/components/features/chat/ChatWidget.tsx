'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetGuestMessagesQuery,
  useGetMessagesQuery,
  useLinkGuestConversationMutation,
  useSendGuestMessageMutation,
  useSendMessageMutation,
  useStartConversationMutation,
  useStartGuestConversationMutation,
} from '@/store/api/chatApi';
import type { ChatMessage } from '@/types/api';
import { clearGuestId, getOrCreateGuestId, getGuestId } from '@/lib/chat-guest';
import { getChatSocket, disconnectChatSocket } from '@/services/websocket/chat.socket';
import { ROUTES } from '@/constants/routes';
import { vi } from '@/lib/i18n';
import { ChatMessageList } from '@/features/chat/components/ChatMessageList';

const CONVO_KEY = 'clothify_chat_conversation_id';

export function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [startConversation] = useStartConversationMutation();
  const [startGuestConversation] = useStartGuestConversationMutation();
  const [linkGuest] = useLinkGuestConversationMutation();
  const [sendMessage] = useSendMessageMutation();
  const [sendGuestMessage] = useSendGuestMessageMutation();
  const authConvoSynced = useRef(false);

  const { data: authHistory } = useGetMessagesQuery(conversationId!, {
    skip: !conversationId || !open || !isAuthenticated,
  });
  const { data: guestHistory } = useGetGuestMessagesQuery(
    { conversationId: conversationId!, guestId: guestId! },
    { skip: !conversationId || !open || isAuthenticated || !guestId },
  );

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(CONVO_KEY);
    if (stored) setConversationId(stored);
    setGuestId(getOrCreateGuestId());
  }, []);

  useEffect(() => {
    const history = isAuthenticated ? authHistory : guestHistory;
    if (history?.data) setMessages(history.data);
  }, [authHistory, guestHistory, isAuthenticated]);

  useEffect(() => {
    if (!open || !conversationId || !mounted) return undefined;
    const socket = getChatSocket();
    if (!socket) return undefined;

    socket.emit('chat:join', { conversationId });

    const onNew = (msg: ChatMessage) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      }
    };

    socket.on('message:new', onNew);
    socket.on('new_message', onNew);

    return () => {
      socket.off('message:new', onNew);
      socket.off('new_message', onNew);
    };
  }, [open, conversationId, mounted, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    return () => disconnectChatSocket();
  }, [open]);

  const persistConversation = useCallback((id: string) => {
    setConversationId(id);
    localStorage.setItem(CONVO_KEY, id);
  }, []);

  const ensureAuthenticatedConversation = useCallback(async () => {
    const gid = getGuestId();
    if (gid) {
      try {
        const linked = await linkGuest({ guestId: gid }).unwrap();
        const id = linked.data?.id;
        if (id) {
          persistConversation(id);
          clearGuestId();
          return id;
        }
      } catch {
        /* fall through to startConversation */
      }
    }

    const res = await startConversation().unwrap();
    const id = res.data?.id;
    if (id) persistConversation(id);
    return id ?? null;
  }, [linkGuest, startConversation, persistConversation]);

  useEffect(() => {
    if (!mounted || !isAuthenticated) {
      authConvoSynced.current = false;
      return undefined;
    }

    let cancelled = false;
    void ensureAuthenticatedConversation().then((id) => {
      if (!cancelled && id) authConvoSynced.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [mounted, isAuthenticated, ensureAuthenticatedConversation]);

  const ensureConversation = useCallback(async () => {
    if (isAuthenticated) {
      if (conversationId && authConvoSynced.current) return conversationId;
      const id = await ensureAuthenticatedConversation();
      if (id) authConvoSynced.current = true;
      return id;
    }

    if (conversationId) return conversationId;

    const gid = guestId ?? getOrCreateGuestId();
    setGuestId(gid);
    const res = await startGuestConversation({ guestId: gid }).unwrap();
    const id = res.data?.id;
    if (id) persistConversation(id);
    return id ?? null;
  }, [
    conversationId,
    isAuthenticated,
    guestId,
    ensureAuthenticatedConversation,
    startGuestConversation,
    persistConversation,
  ]);

  const handleOpen = async () => {
    setOpen(true);
    if (mounted) await ensureConversation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    const convId = (await ensureConversation()) ?? conversationId;
    if (!convId) return;

    setMessage('');
    try {
      if (isAuthenticated) {
        const res = await sendMessage({
          conversationId: convId,
          content: text,
        }).unwrap();
        if (res.data) {
          setMessages((prev) =>
            prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data],
          );
        }
      } else {
        const gid = guestId ?? getOrCreateGuestId();
        const res = await sendGuestMessage({
          guestId: gid,
          conversationId: convId,
          content: text,
        }).unwrap();
        if (res.data) {
          setMessages((prev) =>
            prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data],
          );
        }
      }
    } catch {
      setMessage(text);
    }
  };

  const canChat = mounted && (isAuthenticated || guestId);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between bg-primary px-4 py-3.5 text-white">
              <span className="text-sm font-medium">{vi.chat.support}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-white/20"
                aria-label={vi.common.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex h-72 flex-col gap-2 overflow-y-auto bg-surface/50 p-4">
              {!canChat ? (
                <p className="text-center text-sm text-text-secondary">
                  {vi.common.loading}
                </p>
              ) : (
                <ChatMessageList
                  messages={messages}
                  emptyLabel={vi.chat.startConversation}
                />
              )}
              {!isAuthenticated && canChat && (
                <p className="mt-auto text-center text-[11px] text-text-muted">
                  {vi.chat.guestHint}{' '}
                  <Link
                    href={ROUTES.auth.login}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {vi.chat.signInToChat}
                  </Link>
                </p>
              )}
            </div>
            <form
              className="flex gap-2 border-t border-border-subtle bg-white p-3"
              onSubmit={handleSubmit}
            >
              <Input
                placeholder={vi.chat.typeMessage}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!canChat}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!canChat}
                aria-label={vi.chat.send}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-[var(--shadow-lg)]"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label={vi.chat.support}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
