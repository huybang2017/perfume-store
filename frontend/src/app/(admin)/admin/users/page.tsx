'use client';

import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { ApiErrorAlert } from '@/components/common/ApiErrorAlert';
import { Badge } from '@/components/ui/badge';
import { useGetUsersQuery } from '@/store/api/userApi';
import { vi } from '@/lib/i18n';

export default function AdminUsersPage() {
  const { data, isLoading, isError } = useGetUsersQuery({ page: 1, limit: 50 });

  return (
    <div>
      <PageHeader title={vi.admin.users} description={vi.admin.usersDesc} />
      {isError && (
        <div className="mb-6">
          <ApiErrorAlert />
        </div>
      )}
      <DataTable
        columns={[
          { key: 'fullName', header: vi.auth.fullName },
          { key: 'email', header: vi.auth.email },
          {
            key: 'role',
            header: vi.admin.role,
            render: (r) => (
              <Badge variant={r.role === 'admin' ? 'default' : 'neutral'}>{r.role}</Badge>
            ),
          },
          {
            key: 'isActive',
            header: vi.common.status,
            render: (r) => (
              <Badge variant={r.isActive ? 'success' : 'danger'}>
                {r.isActive ? vi.admin.active : vi.admin.inactive}
              </Badge>
            ),
          },
        ]}
        data={Array.isArray(data?.data) ? data.data : []}
        isLoading={isLoading}
      />
    </div>
  );
}
