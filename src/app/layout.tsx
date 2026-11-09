import type {Metadata,Viewport} from 'next';
import {Providers} from '@/components/providers';
import './globals.css';
export const metadata:Metadata={title:{default:'Playground Meet — Room for possibility',template:'%s · Playground Meet'},description:'A beautiful space to meet, test products, and build together. HD video, shared whiteboards, polls and feedback.',icons:{icon:'/brand/icon.png'},metadataBase:new URL(process.env.APP_URL||'https://meet.tryplayground.net')};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#FBF7EB'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning><body><a className="skip-link" href="#main">Skip to content</a><Providers>{children}</Providers></body></html>;}
