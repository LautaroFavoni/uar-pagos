"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Zap,
  Wallet,
  Users,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Bell,
  Navigation2,
  Landmark
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getSemanaInfo, formatARS, calcularSaldosLigas, sumaSaldosPendientes } from "@/lib/calculos"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { BRAND } from "@/lib/brand"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAPagar: 0,
    designaciones: 0,
    arbitrosActivos: 0,
    pendienteCobroLigas: 0
  })

  const hoy = new Date()
  const fechaFormateada = format(hoy, "EEEE d 'de' MMMM", { locale: es })
  const { semana, anio } = getSemanaInfo(hoy)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { data: des },
          { data: dct },
          { count: arbCount },
          { data: crg },
          { data: cbr }
        ] = await Promise.all([
          supabase
            .from('designaciones')
            .select('total')
            .eq('semana', semana)
            .eq('anio', anio)
            .eq('estado', 'pendiente'),
          supabase
            .from('descuentos')
            .select('monto')
            .eq('semana', semana)
            .eq('anio', anio)
            .eq('estado', 'pendiente'),
          supabase
            .from('arbitros')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true),
          supabase
            .from('cargos_liga')
            .select('liga_id, monto'),
          supabase
            .from('cobros_liga')
            .select('liga_id, monto')
        ])

        const totalHonorarios = des?.reduce((acc, d) => acc + d.total, 0) || 0
        const totalDescuentos = dct?.reduce((acc, d) => acc + d.monto, 0) || 0
        const saldosLigas = calcularSaldosLigas(crg || [], cbr || [])

        setStats({
          totalAPagar: totalHonorarios - totalDescuentos,
          designaciones: des?.length || 0,
          arbitrosActivos: arbCount || 0,
          pendienteCobroLigas: sumaSaldosPendientes(saldosLigas)
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [semana, anio])

  return (
    <div className="space-y-10 pb-20">
      {/* Header Sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand font-black uppercase tracking-[0.2em] text-[10px]">
            <span className="w-8 h-[2px] bg-brand"></span>
            System Overview
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-zinc-900 flex items-center gap-3">
            Panel de Control
            <span className="text-brand opacity-20">/</span>
            <span className="text-zinc-400 font-medium text-2xl">{BRAND.nombre}</span>
          </h2>
          <p className="text-zinc-500 font-medium capitalize flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {fechaFormateada} <span className="text-zinc-300">•</span> Semana {semana}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <Link href="/dashboard/designaciones">
                <Button variant="outline" className="h-12 border-zinc-200 font-bold px-6 rounded-xl hover:bg-zinc-50">
                    Ver Designaciones
                </Button>
            </Link>
            <Link href="/dashboard/carga-rapida">
                <Button className="h-12 bg-brand hover:bg-brand-hover text-white font-bold px-8 rounded-xl shadow-lg shadow-blue-200 gap-2">
                    <Zap className="h-4 w-4 fill-white" />
                    CARGA RÁPIDA
                </Button>
            </Link>
        </div>
      </div>

      {/* Card: Pendiente de cobro a ligas */}
      <Link href="/dashboard/cobros-ligas" className="block group">
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900 text-white p-6 flex items-center justify-between gap-6 shadow-2xl transition-all group-hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative flex items-center gap-5">
            <div className="bg-brand w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Pendiente de Cobro a Ligas</CardTitle>
              {loading ? (
                <Skeleton className="h-8 w-40 mt-2 bg-zinc-800" />
              ) : (
                <div className="text-3xl font-black tracking-tighter">{formatARS(stats.pendienteCobroLigas)}</div>
              )}
            </div>
          </div>
          <ArrowRight className="relative h-5 w-5 text-zinc-500 transition-transform group-hover:translate-x-1 shrink-0" />
        </div>
      </Link>

      {/* Grid de Stats Premium */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Financiero */}
        <Card className="relative overflow-hidden border-none shadow-2xl rounded-[2rem] group bg-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <CardHeader className="relative pb-2">
            <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
               <Wallet className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {loading ? (
                <Skeleton className="h-10 w-40" />
            ) : (
                <div className="text-4xl font-black text-zinc-900 tracking-tighter">
                    {formatARS(stats.totalAPagar)}
                </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 w-fit px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4" />
                Semana en curso
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Operativo */}
        <Card className="relative overflow-hidden border-none shadow-2xl rounded-[2rem] group bg-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <CardHeader className="relative pb-2">
            <div className="bg-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
               <Navigation2 className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Partidos Cargados</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {loading ? (
                <Skeleton className="h-10 w-20" />
            ) : (
                <div className="text-4xl font-black text-zinc-900 tracking-tighter">
                    {stats.designaciones}
                </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 w-fit px-3 py-1 rounded-full">
                <Bell className="h-4 w-4" />
                Actualizado hoy
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Arbitros */}
        <Card className="relative overflow-hidden border-none shadow-2xl rounded-[2rem] group bg-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <CardHeader className="relative pb-2">
            <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-200">
               <Users className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Colegiados Activos</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {loading ? (
                <Skeleton className="h-10 w-20" />
            ) : (
                <div className="text-4xl font-black text-zinc-900 tracking-tighter">
                    {stats.arbitrosActivos}
                </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-orange-600 font-bold text-sm bg-orange-50 w-fit px-3 py-1 rounded-full">
                <ShieldCheck className="h-4 w-4" />
                Base Verificada
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secciones de Acceso Rápido */}
      <div className="grid gap-8 md:grid-cols-5 lg:grid-cols-6 mt-12">
        <div className="md:col-span-3 lg:col-span-4 space-y-6">
            <h3 className="text-xl font-black italic tracking-tight flex items-center gap-3">
                <span className="w-2 h-6 bg-brand rounded-full"></span>
                ACCIONES ESTRATÉGICAS
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionCard 
                    title="Liquidar Pagos"
                    desc="Procesar y cerrar la liquidación semanal de todos los árbitros."
                    href="/dashboard/resumen"
                    icon={Wallet}
                    primary
                />
                <ActionCard
                    title="Designaciones"
                    desc="Gestionar ternas y generar reporte para WhatsApp."
                    href="/dashboard/designaciones"
                    icon={Navigation2}
                />
                <ActionCard
                    title="Cobros a Ligas"
                    desc="Registrar facturación y cobranza a cada torneo."
                    href="/dashboard/cobros-ligas"
                    icon={Landmark}
                />
                <ActionCard
                    title="Configuración"
                    desc="Ajustar tablas de honorarios, viáticos y personal."
                    href="/dashboard/configuracion"
                    icon={ShieldCheck}
                />
                <ActionCard
                    title="Historial"
                    desc="Consultar archivos de pagos y liquidaciones pasadas."
                    href="/dashboard/historial"
                    icon={CalendarDays}
                />
            </div>
        </div>

        <div className="md:col-span-2 space-y-6">
             <h3 className="text-xl font-black italic tracking-tight flex items-center gap-3">
                <span className="w-2 h-6 bg-zinc-300 rounded-full"></span>
                ESTADO OPERATIVO
            </h3>
            <Card className="rounded-[2rem] border-zinc-100 shadow-lg bg-zinc-50/50 p-6">
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center mb-6">
                         <div className={cn(
                            "w-4 h-4 rounded-full animate-pulse",
                            stats.designaciones > 0 ? "bg-emerald-500" : "bg-zinc-300"
                         )} />
                    </div>
                    <div className="space-y-2">
                        <p className="font-black text-zinc-900 text-lg">
                            {stats.designaciones > 0 ? "Sistema Actualizado" : "Sin Actividad Semanal"}
                        </p>
                        <p className="text-zinc-500 text-sm font-medium px-4">
                            {stats.designaciones > 0 
                                ? "Hay carga detectada en el sistema. Recuerda liquidar al finalizar la jornada." 
                                : "Aún no se han registrado designaciones para el periodo actual."}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  )
}

function ActionCard({ title, desc, href, icon: Icon, primary = false }: any) {
    return (
        <Link href={href} className="group">
            <div className={cn(
                "p-6 h-full rounded-[2rem] border transition-all duration-300 flex flex-col justify-between",
                primary 
                    ? "bg-brand border-brand text-white shadow-xl shadow-blue-200 hover:-translate-y-1" 
                    : "bg-white border-zinc-100 hover:border-brand/30 hover:shadow-xl hover:-translate-y-1"
            )}>
                <div>
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-6",
                        primary ? "bg-white/10" : "bg-zinc-50"
                    )}>
                        <Icon className={cn("h-5 w-5", primary ? "text-white" : "text-brand")} />
                    </div>
                    <h4 className="font-black italic text-lg mb-2">{title}</h4>
                    <p className={cn(
                        "text-sm font-medium",
                        primary ? "text-emerald-100/70" : "text-zinc-500"
                    )}>
                        {desc}
                    </p>
                </div>
                <div className="mt-8 flex justify-end">
                    <ArrowRight className={cn(
                        "h-5 w-5 transition-transform group-hover:translate-x-1",
                        primary ? "text-white" : "text-zinc-300"
                    )} />
                </div>
            </div>
        </Link>
    )
}
