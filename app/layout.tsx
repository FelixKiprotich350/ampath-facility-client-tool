import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Facility Client Tool',
  description: 'Data collection and sync tool for facilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}