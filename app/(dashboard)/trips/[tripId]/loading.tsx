export default function TripLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      {/* Header card */}
      <div className="h-20 rounded-lg bg-zinc-100" />

      {/* 2-col grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-48 rounded-lg bg-zinc-100" />
        <div className="h-48 rounded-lg bg-zinc-100" />
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-36 rounded-lg bg-zinc-100" />
        <div className="h-36 rounded-lg bg-zinc-100" />
      </div>

      {/* Itinerary */}
      <div className="h-32 rounded-lg bg-zinc-100" />
    </div>
  );
}
