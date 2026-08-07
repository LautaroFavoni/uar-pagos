"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Zap,
  FileEdit,
  History,
  Settings,
  LogOut,
  Wallet,
  Scissors,
  Landmark,
  BarChart3
} from "lucide-react"

import Image from "next/image"
import { BRAND } from "@/lib/brand"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Designaciones", href: "/dashboard/designaciones", icon: FileEdit },
  { label: "Descuentos", href: "/dashboard/descuentos", icon: Scissors },
  { label: "Carga Rápida", href: "/dashboard/carga-rapida", icon: Zap },
  { label: "Resumen", href: "/dashboard/resumen", icon: Wallet },
  { label: "Cobros a Ligas", href: "/dashboard/cobros-ligas", icon: Landmark },
  { label: "Historial", href: "/dashboard/historial", icon: History },
  { label: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
  { label: "Config", href: "/dashboard/configuracion", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900 text-zinc-400 fixed inset-y-0 left-0">
        <div className="p-8 flex flex-col items-center">
          <div className="bg-white p-2 rounded-2xl shadow-lg mb-4">
            <Image src={BRAND.logo} alt={BRAND.nombre} width={64} height={64} className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-sm font-black text-white italic tracking-widest text-center">
            {BRAND.nombreLargo.toUpperCase()}
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium",
                  isActive 
                    ? "bg-brand text-white" 
                    : "hover:bg-zinc-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around items-center h-20 pb-2 z-50 px-2 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] gap-1 px-1 py-1 rounded-xl transition-all",
                isActive 
                  ? "text-brand" 
                  : "text-zinc-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-full transition-all",
                isActive ? "bg-brand/10" : ""
              )}>
                <item.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
