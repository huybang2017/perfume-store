'use client';

import { useEffect, useRef } from 'react';
import { formatDateTime } from '@/lib/i18n';
import type { ChatMessage } from '@/types/api';

function isFromCustomer(m: ChatMessage) {
  return m.senderType === 'CUSTOMER' || m.senderRole === 'customer';
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  emptyLabel: string;
}

export function ChatMessageList({ messages, emptyLabel }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages.length) {
    return (
      <p className="flex flex-1 items-center justify-center text-center text-sm text-text-muted">
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      {messages.map((m) => {
        const customer = isFromCustomer(m);
        return (
          <div
            key={m.id}
            className={customer ? 'flex flex-col items-end' : 'flex flex-col items-start'}
          >
            <div
              className={
                customer
                  ? 'max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-white'
                  : 'max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm text-text-primary shadow-sm ring-1 ring-border-subtle'
              }
            >
              {m.content}
            </div>
            <span className="mt-0.5 px-1 text-[10px] text-text-muted">
              {formatDateTime(m.createdAt)}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </>
  );
}
