"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Designacion, Arbitro, Liga } from "@/lib/types"
import { getSemanaInfo } from "@/lib/calculos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  Share2, 
  Camera, 
  Copy, 
  ChevronLeft, 
  ChevronRight,
  User,
  Zap,
  Calendar,
  MessageCircle,
  Eye,
  EyeOff,
  Trash2,
  Trophy,
  Pencil
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ModalEditDesignacion } from "@/components/designaciones/ModalEditDesignacion"

export default function DesignacionesPage() {
  const [loading, setLoading] = useState(true)
  const [designaciones, setDesignaciones] = useState<any[]>([])
  const [isPhotoMode, setIsPhotoMode] = useState(false)
  const [editingDesignacion, setEditingDesignacion] = useState<any | null>(null)
  
  const hoy = new Date()
  const { semana: semActual, anio: anioActual } = getSemanaInfo(hoy)
  const [semana, setSemana] = useState(semActual)
  const [anio, setAnio] = useState(anioActual)
  
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('designaciones')
        .select(`
          *,
          arbitros(nombre),
          ligas(nombre)
        `)
        .eq('semana', semana)
        .eq('anio', anio)
        .order('fecha')

      if (error) throw error
      setDesignaciones(data || [])
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar designaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [semana, anio])

  const handleDeleteDesignacion = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas borrar esta designación?")) return

    const { error } = await supabase
      .from('designaciones')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error al borrar designación")
    } else {
      toast.success("Designación eliminada")
      setDesignaciones(prev => prev.filter(d => d.id !== id))
    }
  }

  // Consolidar registros por PARTIDO (misma liga, misma fecha, mismos equipos/hora)
  const groupedTasks: any[] = []
  
  designaciones.forEach(d => {
    const key = `${d.liga_id}-${d.fecha}-${d.equipo_local}-${d.equipo_visitante}-${d.hora}`
    let match = groupedTasks.find(g => g.key === key)
    if (!match) {
        match = {
            key,
            liga: d.ligas?.nombre || "Sin Liga",
            fecha: d.fecha,
            equipo_local: d.equipo_local || "S/D",
            equipo_visitante: d.equipo_visitante || "S/D",
            hora: d.hora || "--:--",
            ternas: []
        }
        groupedTasks.push(match)
    }
    match.ternas.push(d)
  })

  // Agrupar los PARTIDOS consolidados por DÍA
  const diasUnicos = Array.from(new Set(groupedTasks.map(t => t.fecha))).sort()

  const handleCopyMatchWhatsApp = (match: any) => {
    let text = `🏉 *DESIGNACIÓN UAR*\n`
    text += `━━━━━━━━━━━━━━\n`
    text += `🏆 *${match.liga.toUpperCase()}*\n`
    text += `⚔️ *${match.equipo_local} vs ${match.equipo_visitante}*\n`
    text += `📅 ${format(new Date(match.fecha + "T12:00:00"), "dd/MM", { locale: es })} 🕒 ${match.hora}hs\n\n`
    
    text += match.ternas.map((r: any) => `*${r.rol.replace('_', ' ').toUpperCase()}*: ${r.arbitros?.nombre}`).join('\n')
    text += `\n━━━━━━━━━━━━━━\n`
    text += `_Favor confirmar recepción_`
    
    navigator.clipboard.writeText(text)
    toast.success("Mensaje del partido copiado")
  }

  const copyWhatsAppText = () => {
    let text = `⚽ *DESIGNACIONES UAR - SEMANA ${semana}* ⚽\n\n`
    
    diasUnicos.forEach(fecha => {
        text += `📅 *${format(new Date(fecha + "T12:00:00"), "eeee dd/MM", { locale: es }).toUpperCase()}*\n`
        const partidosDelDia = groupedTasks.filter(t => t.fecha === fecha)
        
        partidosDelDia.forEach(match => {
            text += `🔹 *${match.liga}*: ${match.equipo_local} vs ${match.equipo_visitante} (${match.hora}hs)\n`
            text += match.ternas.map((r: any) => `  - ${r.rol}: ${r.arbitros?.nombre}`).join('\n')
            text += `\n`
        })
        text += `\n`
    })
    
    text += `_Generado por UAR Pagos_`
    navigator.clipboard.writeText(text)
    toast.success("Designaciones completas copiadas")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B5E20]"></div>
        <p className="text-zinc-500 font-bold animate-pulse">CARGANDO DESIGNACIONES...</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-8 pb-20", isPhotoMode && "fixed inset-0 z-[100] bg-white p-10 overflow-auto md:ml-0")}>
      {!isPhotoMode && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black tracking-tight text-[#1B5E20]">Designaciones</h2>
                <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    <Calendar className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Semana {semana}</span>
                </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Organiza y comparte las ternas arbitrales de la semana.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSemana(s => s - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-2 text-center min-w-[80px]">
                    <span className="text-[10px] font-black text-zinc-400 block leading-none">SEMANA</span>
                    <span className="text-lg font-black text-zinc-800">{semana}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSemana(s => s + 1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    className="gap-2 font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-11 px-6 rounded-xl"
                    onClick={copyWhatsAppText}
                >
                <Share2 className="h-4 w-4" /> Todo WA
                </Button>
                <Button 
                    className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white gap-2 font-bold h-11 px-6 rounded-xl"
                    onClick={() => setIsPhotoMode(true)}
                >
                <Camera className="h-4 w-4" /> Modo Foto
                </Button>
            </div>
          </div>
        </div>
      )}

      {isPhotoMode && (
        <div className="flex items-center justify-between mb-8 pb-4 border-b">
           <div className="flex items-center gap-4">
              <span className="bg-[#1B5E20] text-white p-2 rounded-lg font-black italic">UAR</span>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 uppercase">Designaciones Oficiales</h1>
                <p className="text-zinc-500 font-bold">Semana {semana} — {anio}</p>
              </div>
           </div>
           <Button variant="ghost" className="gap-2 text-zinc-400 font-bold" onClick={() => setIsPhotoMode(false)}>
              <EyeOff className="h-4 w-4" /> Salir del Modo Foto
           </Button>
        </div>
      )}

      <div className="space-y-12">
        {diasUnicos.length > 0 ? diasUnicos.map(fecha => (
            <div key={fecha} className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-zinc-200"></div>
                    <div className="bg-zinc-100 px-6 py-2 rounded-full border text-[#1B5E20] font-black italic text-xs uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(fecha + "T12:00:00"), "eeee dd 'de' MMMM", { locale: es })}
                    </div>
                    <div className="h-px flex-1 bg-zinc-200"></div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {groupedTasks.filter(t => t.fecha === fecha).map((match, idx) => (
                        <Card key={idx} className={cn(
                            "group border-none shadow-sm overflow-hidden rounded-2xl transition-all hover:shadow-md",
                            isPhotoMode && "shadow-none border border-zinc-100 rounded-none mb-2"
                        )}>
                            <div className="bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex flex-col items-center justify-center bg-zinc-900 text-white min-w-[70px] h-[70px] rounded-xl overflow-hidden">
                                        <span className="text-[10px] font-bold opacity-60 uppercase">{match.liga.substring(0, 10)}</span>
                                        <span className="text-xl font-black">{match.hora}</span>
                                        <span className="text-[8px] font-black opacity-40 italic">UAR-MATCH</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                                            <Trophy className="h-3 w-3" /> {match.liga}
                                        </div>
                                        <div className="text-lg font-black text-zinc-800 leading-tight">
                                            {match.equipo_local === "S/D" && match.equipo_visitante === "S/D" ? (
                                                <span className="text-zinc-500 italic">Sesión de {match.liga}</span>
                                            ) : (
                                                <>{match.equipo_local} <span className="text-zinc-300 mx-1">vs</span> {match.equipo_visitante}</>
                                            )}
                                        </div>
                                        {match.ternas[0]?.observaciones && (
                                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mt-1 inline-block">
                                                📝 {match.ternas[0].observaciones}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {!isPhotoMode && (
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="rounded-full gap-2 font-black text-[10px] uppercase border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20] hover:text-white"
                                            onClick={() => handleCopyMatchWhatsApp(match)}
                                        >
                                            <MessageCircle className="h-3 w-3" /> WhatsApp Terna
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full text-zinc-400 hover:text-[#1B5E20] hover:bg-emerald-50"
                                            onClick={() => setEditingDesignacion(match)}
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-zinc-50/50 border-t p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {match.ternas.map((t: any) => (
                                    <div key={t.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-zinc-100 shadow-xs relative group-item">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 border">
                                            {t.rol.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-black text-zinc-900 truncate">
                                                {t.arbitros?.nombre || t.arbitro_nombre || "Cargando..."}
                                            </div>
                                            <div className="text-[8px] font-bold text-zinc-400 uppercase truncate">{t.rol}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )) : (
            <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-zinc-50 flex flex-col items-center space-y-4">
                <div className="bg-zinc-50 p-6 rounded-full">
                    <Calendar className="h-12 w-12 text-zinc-200" />
                </div>
                <div className="max-w-xs">
                    <h3 className="text-lg font-black text-zinc-400 italic">SIN DESIGNACIONES</h3>
                    <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">
                        Parece que no hay actividad cargada para esta semana todavía.
                    </p>
                </div>
            </div>
        )}
      </div>

      {isPhotoMode && (
         <div className="mt-10 text-center text-zinc-300 font-bold text-sm tracking-widest pt-10 border-t uppercase">
            Sistema Oficial de Gestión UAR — {anio}
         </div>
      )}

      <ModalEditDesignacion 
        match={editingDesignacion}
        isOpen={!!editingDesignacion}
        onClose={() => setEditingDesignacion(null)}
        onSave={fetchData}
      />
    </div>
  )
}
