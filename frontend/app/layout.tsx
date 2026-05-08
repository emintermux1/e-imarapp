import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'e-İmar Platform',
  description: 'Yerel yönetimler için imar planlama ve izleme platformu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-background text-foreground">
        <main>{children}</main>
      </body>
    </html>
  )
}