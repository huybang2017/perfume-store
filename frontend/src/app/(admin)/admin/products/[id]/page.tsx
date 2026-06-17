'use client';

import { useParams } from 'next/navigation';
import { AdminProductEditor } from '@/features/admin/components/AdminProductEditor';

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  return <AdminProductEditor productId={id === 'new' ? undefined : id} />;
}
