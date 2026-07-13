const GRADIENTS = [
  "from-sage-400 to-sage-600",
  "from-sage-300 to-sage-500",
  "from-sage-500 to-sage-700",
  "from-sage-200 to-sage-400",
];

function hashToIndex(seed: string, length: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % length;
}

interface AvatarProps {
  id: string;
  name: string | null;
  image?: string | null;
  className?: string;
}

export function Avatar({ id, name, image, className = "h-8 w-8" }: AvatarProps) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ""} className={`${className} rounded-full object-cover ring-2 ring-white`} />;
  }
  const gradient = GRADIENTS[hashToIndex(id, GRADIENTS.length)];
  return (
    <span
      className={`${className} flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[11px] font-semibold text-white ring-2 ring-white`}
    >
      {initial}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 4,
}: {
  people: { id: string; name: string | null; image?: string | null }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  return (
    <div className="flex -space-x-2.5">
      {shown.map((p) => (
        <Avatar key={p.id} id={p.id} name={p.name} image={p.image} />
      ))}
      {overflow > 0 && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-900 text-[11px] font-semibold text-white ring-2 ring-white">
          +{overflow}
        </span>
      )}
    </div>
  );
}
