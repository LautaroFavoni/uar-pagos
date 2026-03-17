"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FilaArbitro } from "@/components/resumen/FilaArbitro"
import { Card } from "@/components/ui/card"
import { Calendar, Wallet, AlertCircle, Loader2 } from "lucide-react"

export default function ResumenPublicoPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ designaciones: any[], descuentos: any[] }>({ designaciones: [], descuentos: [] })
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      try {
        const decoded = atob(id as string)
        const matchSemana = decoded.match(/s(\d+)-a(\d+)/)
        if (!matchSemana) throw new Error("Link no válido")
        
        const semana = parseInt(matchSemana[1])
        const anio = parseInt(matchSemana[2])

        const [
          { data: des, error: e1 }, 
          { data: dct, error: e2 }
        ] = await Promise.all([
          supabase
            .from('designaciones')
            .select('*, arbitros(nombre), ligas(nombre)')
            .eq('semana', semana)
            .eq('anio', anio)
            .order('arbitro_id'),
          supabase
            .from('descuentos')
            .select('*, arbitros(nombre)')
            .eq('semana', semana)
            .eq('anio', anio)
        ])

        if (e1 || e2) throw new Error("Error al cargar datos")
        
        setData({
          designaciones: des?.map(d => ({ ...d, arbitro_nombre: d.arbitros?.nombre, liga_nombre: d.ligas?.nombre })) || [],
          descuentos: dct || []
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-blue-800">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando Liquidación...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4 bg-white p-10 rounded-3xl shadow-xl">
          <div className="bg-red-50 text-red-500 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
             <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black text-zinc-800">Ups! Algo salió mal</h1>
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    )
  }

  const arbitrosIds = Array.from(new Set([
    ...data.designaciones.map(d => d.arbitro_id),
    ...data.descuentos.map(d => d.arbitro_id)
  ]))

  const decodedParams = atob(id as string)
  const [sPart, aPart] = decodedParams.replace('s', '').split('-a')

  return (
    <div className="min-h-screen bg-zinc-50/50 p-2 sm:p-4 md:p-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-zinc-200/60 transition-all">
           <div className="flex items-center gap-6">
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-blue-100 border border-blue-50">
                <img src="/uar-logo.png" alt="UAR" className="h-16 w-16 object-contain" />
              </div>
              <div className="space-y-4">
                <div className="bg-[#003399] inline-block px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-blue-100 animate-in fade-in slide-in-from-left-4 duration-500">
                  Oficial UAR | Colegio de Árbitros
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic text-zinc-900 tracking-tight leading-none group">
                    Planilla de <span className="text-[#003399] drop-shadow-sm transition-all hover:text-blue-500">Pagos</span>
                  </h1>
                  <p className="text-zinc-400 font-bold text-xs sm:text-sm tracking-tight">Liquidación Semanal de Actividades Arbitrales</p>
                </div>
              </div>
           </div>
           <div className="bg-white border border-zinc-100 p-3 sm:p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 min-w-[180px] self-start md:self-end hover:scale-[1.02] transition-transform cursor-default underline-offset-4">
              <div className="bg-blue-50 p-3 rounded-2xl">
                 <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#003399]" />
              </div>
              <div>
                 <span className="text-[9px] font-black text-zinc-400 block tracking-[0.1em] leading-none mb-1">SEMANA / AÑO</span>
                 <span className="text-lg sm:text-xl font-black text-zinc-800 tracking-tighter">{sPart} / {aPart}</span>
              </div>
           </div>
        </header>

        <section className="space-y-4 sm:space-y-6">
           {arbitrosIds.length > 0 ? (
             arbitrosIds.map(arbId => {
               const ads = data.designaciones.filter(d => d.arbitro_id === arbId)
               const dcs = data.descuentos.filter(d => d.arbitro_id === arbId)
               const arbName = ads[0]?.arbitro_nombre || dcs[0]?.arbitros?.nombre || "Árbitro"
               
               return (
                 <FilaArbitro 
                   key={arbId}
                   arbitroId={arbId}
                   arbitroNombre={arbName}
                   designaciones={ads}
                   descuentos={dcs}
                   readonly={true}
                 />
               )
             })
           ) : (
             <Card className="border-dashed border-2 py-20 text-center flex flex-col items-center justify-center p-6 space-y-4 rounded-3xl">
                <Wallet className="h-12 w-12 text-zinc-200" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">No hay registros para esta semana</p>
             </Card>
           )}
        </section>

        <footer className="text-center pt-10 pb-20 border-t border-dashed">
           <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                Este es un documento oficial del sistema de gestión de pagos UAR.
           </p>
           <p className="text-zinc-300 text-[10px] italic mt-1 font-medium">
             Generado automáticamente - {new Date().toLocaleDateString('es-AR')}
           </p>
        </footer>
      </div>
    </div>
  )
}
