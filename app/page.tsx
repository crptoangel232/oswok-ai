export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center gap-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">Oswok AI</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Find trustworthy work. Find trustworthy workers.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-gray-600">
          A WhatsApp-first work coordination platform being built for Sierra Leone, starting in Freetown.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border px-4 py-2 text-sm">Worker platform</span>
          <span className="rounded-full border px-4 py-2 text-sm">Employer platform</span>
          <span className="rounded-full border px-4 py-2 text-sm">Admin centre</span>
        </div>
      </section>
    </main>
  );
}
