import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

import { BRAND } from "@/lib/brand"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: `${BRAND.nombre} - Gestión de Pagos`,
  description: `Sistema de Gestión de Pagos - ${BRAND.nombreLargo}`,
  icons: {
    icon: BRAND.logo,
    apple: BRAND.logo,
  },
  openGraph: {
    title: `${BRAND.nombre} - Gestión de Pagos`,
    description: `Liquidaciones semanales - ${BRAND.nombreLargo}`,
    images: [BRAND.logo],
    type: "website",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
