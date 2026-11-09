import Link from 'next/link';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';
export function Header({ action }: { action?: React.ReactNode }) {
  return (
    <header className="site-header">
      <Brand />
      <nav className="header-links" aria-label="Main navigation">
        <Link href="/">Meetings</Link>
        <Link href="/#help">Help</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        {action}
      </div>
    </header>
  );
}
