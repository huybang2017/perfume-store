import type { ApiResponse, ChatMessage, Conversation } from '@/types/api';
import { baseApi } from './baseApi';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startConversation: builder.mutation<ApiResponse<Conversation>, void>({
      query: () => ({ url: '/chat/conversations/start', method: 'POST' }),
      invalidatesTags: ['Chat'],
    }),
    linkGuestConversation: builder.mutation<
      ApiResponse<Conversation>,
      { guestId: string }
    >({
      query: (body) => ({
        url: '/chat/conversations/link-guest',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Chat'],
    }),
    startGuestConversation: builder.mutation<
      ApiResponse<Conversation>,
      { guestId: string }
    >({
      query: (body) => ({
        url: '/chat/guest/conversations/start',
        method: 'POST',
        body,
      }),
    }),
    getConversations: builder.query<ApiResponse<Conversation[]>, void>({
      query: () => '/admin/chat/conversations',
      providesTags: ['Chat'],
    }),
    getMessages: builder.query<ApiResponse<ChatMessage[]>, string>({
      query: (conversationId) =>
        `/chat/conversations/${conversationId}/messages`,
    }),
    getAdminMessages: builder.query<ApiResponse<ChatMessage[]>, string>({
      query: (conversationId) =>
        `/admin/chat/conversations/${conversationId}/messages`,
    }),
    getGuestMessages: builder.query<
      ApiResponse<ChatMessage[]>,
      { conversationId: string; guestId: string }
    >({
      query: ({ conversationId, guestId }) =>
        `/chat/guest/conversations/${conversationId}/messages?guestId=${encodeURIComponent(guestId)}`,
    }),
    sendMessage: builder.mutation<
      ApiResponse<ChatMessage>,
      { conversationId: string; content: string }
    >({
      query: (body) => ({ url: '/chat/messages', method: 'POST', body }),
    }),
    sendGuestMessage: builder.mutation<
      ApiResponse<ChatMessage>,
      { guestId: string; conversationId: string; content: string }
    >({
      query: (body) => ({ url: '/chat/guest/messages', method: 'POST', body }),
    }),
    sendAdminMessage: builder.mutation<
      ApiResponse<ChatMessage>,
      { conversationId: string; content: string }
    >({
      query: ({ conversationId, content }) => ({
        url: `/admin/chat/conversations/${conversationId}/messages`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Chat'],
    }),
    markConversationRead: builder.mutation<ApiResponse<{ ok: boolean }>, string>(
      {
        query: (conversationId) => ({
          url: `/admin/chat/conversations/${conversationId}/read`,
          method: 'POST',
        }),
        invalidatesTags: ['Chat'],
      },
    ),
    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => '/chat/unread-count',
    }),
  }),
});

export const {
  useStartConversationMutation,
  useLinkGuestConversationMutation,
  useStartGuestConversationMutation,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetAdminMessagesQuery,
  useGetGuestMessagesQuery,
  useSendMessageMutation,
  useSendGuestMessageMutation,
  useSendAdminMessageMutation,
  useMarkConversationReadMutation,
  useGetUnreadCountQuery,
} = chatApi;
