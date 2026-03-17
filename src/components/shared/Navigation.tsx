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
  Scissors
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Designaciones", href: "/dashboard/designaciones", icon: FileEdit },
  { label: "Descuentos", href: "/dashboard/descuentos", icon: Scissors },
  { label: "Carga Rápida", href: "/dashboard/carga-rapida", icon: Zap },
  { label: "Resumen", href: "/dashboard/resumen", icon: Wallet },
  { label: "Historial", href: "/dashboard/historial", icon: History },
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
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-[#1B5E20] p-1.5 rounded-lg text-white">UAR</span>
            Colegio Árbitros
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
                    ? "bg-[#1B5E20] text-white" 
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
                  ? "text-[#1B5E20]" 
                  : "text-zinc-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-full transition-all",
                isActive ? "bg-[#1B5E20]/10" : ""
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
