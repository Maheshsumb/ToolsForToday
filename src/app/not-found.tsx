import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-heading text-3xl font-semibold">Page not found</h1>
      <p className="mt-4">This page could not be found.</p>
      <Link href="/" className="mt-6 inline-block rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Return to ToolsForToday</Link>
    </main>
  );
}
