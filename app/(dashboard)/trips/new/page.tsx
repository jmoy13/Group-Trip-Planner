import { CreateTripForm } from "@/components/trips/CreateTripForm";
import { AppShell } from "@/components/layout/AppShell";
import { getGenericShellData } from "@/lib/layout/shell";

export default async function NewTripPage() {
  const { user, nav } = await getGenericShellData();

  return (
    <AppShell
      breadcrumb={[{ label: "My Trips", href: "/trips" }, { label: "New trip" }]}
      userName={user.name ?? user.email ?? "You"}
      userEmail={user.email ?? ""}
      userImage={user.image}
      nav={nav}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold text-sage-900">Create a trip</h1>
          <p className="text-sm text-sage-500">
            You&apos;ll be the owner and can invite others once it&apos;s created.
          </p>
        </div>
        <CreateTripForm />
      </div>
    </AppShell>
  );
}
