import './globals.css';
import type { ReactNode } from 'react';
export const metadata={title:'Digital Hotel Concierge',description:'QR-based guest experience and hotel service platform'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>}
