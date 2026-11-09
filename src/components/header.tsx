import {ArrowUpRight} from 'lucide-react';
import {Brand} from './brand';import {ThemeToggle} from './theme-toggle';
export function Header({action}:{action?:React.ReactNode}){return <header className="site-header"><Brand/><nav aria-label="Main navigation"><a className="ecosystem-link" href="https://tryplayground.net" target="_blank" rel="noreferrer">Back to Playground <ArrowUpRight size={14}/></a><span className="header-divider"/><ThemeToggle/>{action}</nav></header>;}
