export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 px-8 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Exam Study App
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Self-hosted exam study application with spaced repetition (SM-2) and
          analytics.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="/admin"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Manage Exams
          </a>
          <a
            href="/study"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Start Studying
          </a>
        </div>
      </main>
    </div>
  );
}
