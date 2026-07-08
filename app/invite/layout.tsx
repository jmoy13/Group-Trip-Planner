export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-sage-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-sage-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
