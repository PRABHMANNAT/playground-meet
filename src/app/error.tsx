'use client';
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="document">
      <h1>A little interruption.</h1>
      <p>We couldn’t load this space. Your saved meeting notes are still stored on the server.</p>
      <button className="button primary" onClick={retry}>
        Try again
      </button>
      <a className="button secondary" href="/">
        Back to Meet
      </a>
    </main>
  );
}
