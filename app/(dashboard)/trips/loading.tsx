export default function TripsLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded bg-zinc-100" />
        <div className="h-9 w-24 rounded-md bg-zinc-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 rounded-lg bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
