'use client';

import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { vi } from '@/lib/i18n';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import {
  useGetConversationsQuery,
  useGetAdminMessagesQuery,
  useMarkConversationReadMutation,
  useSendAdminMessageMutation,
} from '@/store/api/chatApi';
import type { ChatMessage, Conversation } from '@/types/api';
import { getChatSocket } from '@/services/websocket/chat.socket';
import { ChatMessageList } from './ChatMessageList';

export function AdminChatPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { data: convData, isLoading: loadingConvs, isError: convError, refetch: refetchConvs } =
    useGetConversationsQuery();
  const conversations = Array.isArray(convData?.data) ? convData.data : [];

  const { data: msgData, isLoading: loadingMsgs, isError: msgError } = useGetAdminMessagesQuery(
    selectedId!,
    { skip: !selectedId },
  );

  const [sendAdminMessage, { isLoading: sending }] = useSendAdminMessageMutation();
  const [markRead] = useMarkConversationReadMutation();

  useEffect(() => {
    if (Array.isArray(msgData?.data)) setMessages(msgData.data);
    else setMessages([]);
  }, [msgData]);

  useEffect(() => {
    if (!selectedId) return undefined;
    markRead(selectedId);
    const socket = getChatSocket();
    if (!socket) return undefined;

    socket.emit('admin:join');
    socket.emit('chat:join', { conversationId: selectedId });

    const onNew = (msg: ChatMessage) => {
      if (msg.conversationId === selectedId) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      }
      refetchConvs();
    };

    const onUpdated = () => refetchConvs();

    socket.on('message:new', onNew);
    socket.on('new_message', onNew);
    socket.on('conversation:updated', onUpdated);

    return () => {
      socket.off('message:new', onNew);
      socket.off('new_message', onNew);
      socket.off('conversation:updated', onUpdated);
    };
  }, [selectedId, markRead, refetchConvs]);

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id);
    setDraft('');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId) return;
    setDraft('');
    try {
      const res = await sendAdminMessage({
        conversationId: selectedId,
        content: text,
      }).unwrap();
      if (res.data) {
        setMessages((prev) =>
          prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data],
        );
      }
      refetchConvs();
    } catch {
      setDraft(text);
    }
  };

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="flex h-[calc(100vh-14rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">
            {vi.admin.conversations}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : convError ? (
            <div className="p-4">
              <ApiErrorAlert />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-text-muted">
              {vi.admin.noConversations}
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleSelect(conv)}
                className={cn(
                  'w-full border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                  selectedId === conv.id && 'bg-blue-50',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {conv.customerName ?? vi.chat.guestLabel}
                  </p>
                  {(conv.unreadCount ?? 0) > 0 && (
                    <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {conv.lastMessage ?? vi.chat.noMessagesYet}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-14rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
        {!selectedId ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <p className="font-medium text-slate-800">{vi.admin.selectConversation}</p>
            <p className="mt-1 text-sm text-slate-500">
              {vi.admin.selectConversationDesc}
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {selected?.customerName ?? vi.chat.guestLabel}
              </p>
              {selected?.customerEmail && (
                <p className="text-xs text-slate-500">{selected.customerEmail}</p>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-surface/50 p-4">
              {loadingMsgs ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-2/3" />
                  <Skeleton className="ml-auto h-12 w-1/2" />
                </div>
              ) : msgError ? (
                <ApiErrorAlert />
              ) : (
                <ChatMessageList
                  messages={messages}
                  emptyLabel={vi.chat.startConversation}
                />
              )}
            </div>
            <form
              onSubmit={handleSend}
              className="flex gap-2 border-t border-border-subtle p-3"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={vi.chat.typeMessage}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={sending} aria-label={vi.chat.send}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
