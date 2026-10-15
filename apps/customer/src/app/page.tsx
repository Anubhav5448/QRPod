export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Scan a QR code
        </h1>
        <p className="text-sm text-neutral-500">
          This page is for restaurant customers. Scan the QR code on your table
          to view the menu.
        </p>
      </div>
    </main>
  );
}
