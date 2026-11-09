import Link from 'next/link';
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Playground Meet home">
      <span className="brand-mark" aria-hidden="true" />
      <span>
        playground<span className="brand-dot">.</span>
      </span>
      <span className="brand-divider" />
      <span className="meet-word">meet</span>
    </Link>
  );
}
