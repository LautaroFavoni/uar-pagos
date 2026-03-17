import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UAR - Gestión de Pagos",
  description: "Sistema de Gestión de Pagos - Colegio de Árbitros de Rosario",
  icons: {
    icon: "/uar-logo.png",
    apple: "/uar-logo.png",
  },
  openGraph: {
    title: "UAR - Gestión de Pagos",
    description: "Liquidaciones semanales del Colegio de Árbitros de Rosario",
    images: ["/uar-logo.png"],
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
