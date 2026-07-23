import Skeleton from './Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-28" key={index} />)}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-outline-variant bg-white p-3">
      <Skeleton className="h-10" />
      {Array.from({ length: rows }).map((_, index) => <Skeleton className="h-14" key={index} />)}
    </div>
  )
}

export function LoadingOverlay({ label = 'Cargando' }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-outline-variant bg-white p-5 shadow-2xl shadow-primary/15">
        <Skeleton className="mx-auto h-16 w-16 rounded-3xl" />
        <p className="mt-4 text-center text-sm font-bold text-on-surface">{label}</p>
        <Skeleton className="mx-auto mt-3 h-2 max-w-48 rounded-full" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-24" />
      <DashboardSkeleton />
    </div>
  )
}
