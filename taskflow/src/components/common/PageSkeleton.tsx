/** Placeholder while the first localStorage read resolves — avoids a flash of
 *  empty states that immediately fill in. */
export function PageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-hidden="true">
      <div className="h-7 w-52 rounded-md bg-surface-hover" />
      <div className="h-12 w-full rounded-xl2 bg-surface-hover" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 w-full rounded-xl2 bg-surface-hover" />
        ))}
      </div>
    </div>
  );
}
