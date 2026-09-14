import Skeleton from "../ui/Skeleton";

export default function FormSkeleton({ fieldCount = 4, showProgress = false }) {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando formulario"
      className="grid gap-4"
      role="status"
    >
      <span className="sr-only">Cargando formulario...</span>

      {showProgress ? (
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-1.5 flex-1 rounded-full" key={index} />
          ))}
        </div>
      ) : null}

      {Array.from({ length: fieldCount }, (_, index) => (
        <div className="grid gap-2" key={index}>
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-[52px] rounded-2xl" />
        </div>
      ))}

      <Skeleton className="h-[52px] rounded-2xl" />
    </div>
  );
}