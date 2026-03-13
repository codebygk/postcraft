import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostCraft - AI Social Post Generator',
  description: 'Generate LinkedIn and X posts instantly with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('postcraft_theme'),p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&p))document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
