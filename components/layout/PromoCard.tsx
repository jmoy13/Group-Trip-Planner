import { MountainScene } from "@/components/illustrations/Mountain";

export function PromoCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-sage-200 bg-sage-50">
      <div className="h-24 w-full">
        <MountainScene className="h-full w-full" />
      </div>
      <div className="p-4">
        <p className="font-serif text-lg font-semibold leading-tight text-sage-900">
          Make it out of
          <br />
          the group chat.
        </p>
        <p className="mt-1 text-xs text-sage-600">Plan together. Travel better.</p>
      </div>
    </div>
  );
}
