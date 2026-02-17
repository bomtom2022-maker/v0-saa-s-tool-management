export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6 mt-14 md:mt-0">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="h-3 w-48 rounded bg-muted animate-pulse hidden sm:block" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="h-4 w-24 rounded bg-muted animate-pulse mb-3" />
              <div className="h-8 w-16 rounded bg-muted animate-pulse mb-2" />
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="h-5 w-40 rounded bg-muted animate-pulse mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                    <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
