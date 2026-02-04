export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Knights & Kings</p>
        <h1 className="mt-4 text-4xl font-semibold">Realm operations dashboard</h1>
        <p className="mt-4 text-lg text-slate-300">
          The monorepo is scaffolded for real-time realm simulation, with API, worker, engine, and
          shared schemas ready for iteration.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        {[
          ['API', 'Express + Prisma scaffolding for realm operations'],
          ['Worker', 'BullMQ tick processor with idempotent hourly logic'],
          ['Engine', 'Pure game rules library for future simulation'],
          ['Shared', 'Zod schemas + types for consistent contracts']
        ].map(([title, description]) => (
          <div key={title} className="rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
