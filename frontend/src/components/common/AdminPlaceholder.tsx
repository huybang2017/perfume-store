export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">{title}</h1>
      <p className="text-sm text-zinc-500">
        Module scaffold ready — extend with feature components and RTK Query endpoints.
      </p>
    </div>
  );
}
