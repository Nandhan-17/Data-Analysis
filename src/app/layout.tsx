import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusAI - Enterprise Project Health & Productivity Intelligence Platform',
  description: 'AI-Powered Enterprise Project Analytics, Workload Heatmaps, Timeline Gantt View & Risk Monitoring',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
