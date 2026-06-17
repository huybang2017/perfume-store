import { PageHeader } from '@/components/common/PageHeader';
import { AdminChatPanel } from '@/features/chat/components/AdminChatPanel';
import { vi } from '@/lib/i18n';

export default function AdminChatPage() {
  return (
    <div>
      <PageHeader title={vi.admin.chatTitle} description={vi.admin.chatDesc} />
      <AdminChatPanel />
    </div>
  );
}
