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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-emerald-800">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-emerald-600" />
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8 border-zinc-200">
           <div>
              <div className="bg-[#1B5E20] inline-block px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-4 shadow-lg shadow-emerald-200">
                Oficial UAR | Colegio de Árbitros
              </div>
              <h1 className="text-4xl font-black italic text-zinc-900 tracking-tight">
                Planilla de <span className="text-[#1B5E20]">Pagos</span>
              </h1>
              <p className="text-zinc-500 font-medium">Liquidación Semanal de Actividades Arbitrales</p>
           </div>
           <div className="bg-white border p-4 rounded-2xl shadow-sm flex items-center gap-4 min-w-[200px]">
              <div className="bg-zinc-50 p-3 rounded-xl">
                 <Calendar className="h-6 w-6 text-[#1B5E20]" />
              </div>
              <div>
                 <span className="text-[10px] font-black text-zinc-400 block tracking-widest">SEMANA / AÑO</span>
                 <span className="text-xl font-black text-zinc-800 tracking-tighter">{sPart} / {aPart}</span>
              </div>
           </div>
        </header>

        <section className="space-y-4">
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
