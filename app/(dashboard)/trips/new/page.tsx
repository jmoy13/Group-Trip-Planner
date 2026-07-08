import { CreateTripForm } from "@/components/trips/CreateTripForm";

export default function NewTripPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-sage-900">Create a trip</h1>
        <p className="text-sm text-sage-500">
          You&apos;ll be the owner and can invite others once it&apos;s created.
        </p>
      </div>
      <CreateTripForm />
    </div>
  );
}
