export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <section aria-labelledby="site-title" className="w-full max-w-xl rounded-2xl border-t-8 border-portland-orange bg-white p-6 sm:p-10">
        <h1 id="site-title" className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">ToolsForToday</h1>
        <p className="mt-4 text-lg">Everyday Tools. One Simple Place.</p>
        <p className="mt-6 leading-relaxed">Our website is under development. We’re building a simple place for free, browser-based everyday tools.</p>
        <div aria-hidden="true" className="mt-8 flex gap-2">
          <span className="h-2 flex-1 rounded-full bg-portland-orange" />
          <span className="h-2 flex-1 rounded-full bg-princeton-orange" />
          <span className="h-2 flex-1 rounded-full bg-indian-yellow" />
          <span className="h-2 flex-1 rounded-full bg-gold-crayola" />
          <span className="h-2 flex-1 rounded-full bg-medium-aquamarine" />
          <span className="h-2 flex-1 rounded-full bg-max-blue" />
        </div>
      </section>
    </main>
  );
}
