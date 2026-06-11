import type { Metadata } from 'next'
import { Inter, Playfair_Display, Italianno } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const italianno = Italianno({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-italianno',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Igor & Ana · 24 de Setembro de 2026',
  description: 'Celebre conosco o nosso casamento em Trancoso, Bahia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${playfair.variable} ${italianno.variable}`}>
        {children}
      </body>
    </html>
  )
}
