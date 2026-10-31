import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">A carregar…</span>
      <Skeleton className="h-3 w-48" />
      <Skeleton className="mt-4 h-10 w-72 max-w-full" />
      <Skeleton className="mt-12 h-3 w-36" />
      <Skeleton className="mt-3 h-14 w-96 max-w-full" />
      <div className="mt-8 grid gap-6 border-y border-rule py-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-3 h-8 w-44" />
          </div>
        ))}
      </div>
      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton className="h-6 w-48" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mt-4 h-12 w-full" />
          ))}
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-6 w-40" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="mt-4 h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
