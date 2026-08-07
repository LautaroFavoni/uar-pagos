"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Users, DollarSign, MapPin, Plus, Save, RefreshCw, Trophy, History, ChevronDown } from "lucide-react"
import { Arbitro, Liga, Precio, Viatico } from "@/lib/types"
import { formatARS } from "@/lib/calculos"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { ModalNuevoArbitro } from "@/components/configuracion/ModalNuevoArbitro"
import { ModalNuevoTorneo } from "@/components/configuracion/ModalNuevoTorneo"
import { ModalNuevaLocalidad } from "@/components/configuracion/ModalNuevaLocalidad"
import { GestionDeudas } from "@/components/configuracion/GestionDeudas"
import { Trash2, AlertCircle } from "lucide-react"

interface GrupoPrecio {
  ligaId: string
  rol: string
  vigente: Precio
  historial: Precio[]
}

// Agrupa las filas de precios por liga+rol: la vigente (vigente_hasta = null)
// queda editable, el resto pasa a historial de solo lectura.
function agruparPrecios(precios: Precio[]): GrupoPrecio[] {
  const grupos = new Map<string, Precio[]>()
  precios.forEach(p => {
    const key = `${p.liga_id}::${p.rol}`
    grupos.set(key, [...(grupos.get(key) || []), p])
  })

  return Array.from(grupos.values()).map(rows => {
    const ordenadas = [...rows].sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))
    const vigente = rows.find(r => r.vigente_hasta === null) ?? ordenadas[0]
    return {
      ligaId: vigente.liga_id,
      rol: vigente.rol,
      vigente,
      historial: ordenadas.filter(r => r.id !== vigente.id)
    }
  })
}

interface GrupoViatico {
  localidad: string
  vigente: Viatico
  historial: Viatico[]
}

function agruparViaticos(viaticos: Viatico[]): GrupoViatico[] {
  const grupos = new Map<string, Viatico[]>()
  viaticos.forEach(v => {
    grupos.set(v.localidad, [...(grupos.get(v.localidad) || []), v])
  })

  return Array.from(grupos.values()).map(rows => {
    const ordenadas = [...rows].sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))
    const vigente = rows.find(r => r.vigente_hasta === null) ?? ordenadas[0]
    return {
      localidad: vigente.localidad,
      vigente,
      historial: ordenadas.filter(r => r.id !== vigente.id)
    }
  })
}

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [arbitros, setArbitros] = useState<Arbitro[]>([])
  const [precios, setPrecios] = useState<Precio[]>([])
  const [viaticos, setViaticos] = useState<Viatico[]>([])
  const [ligas, setLigas] = useState<Liga[]>([])
  const [isModalArbitroOpen, setIsModalArbitroOpen] = useState(false)
  const [isModalTorneoOpen, setIsModalTorneoOpen] = useState(false)
  const [isModalLocalidadOpen, setIsModalLocalidadOpen] = useState(false)

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [
        { data: arb },
        { data: pre },
        { data: via },
        { data: lig }
      ] = await Promise.all([
        supabase.from('arbitros').select('*').order('nombre'),
        supabase.from('precios').select('*'),
        supabase.from('viaticos').select('*').order('localidad'),
        supabase.from('ligas').select('*')
      ])

      setArbitros(arb || [])
      setPrecios(pre || [])
      setViaticos(via || [])
      setLigas(lig || [])
    } catch (error) {
      console.error("Error fetching config data:", error)
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleArbitro = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('arbitros')
      .update({ activo: !currentStatus })
      .eq('id', id)

    if (error) {
      toast.error("Error al actualizar estado")
    } else {
      setArbitros(prev => prev.map(a => a.id === id ? { ...a, activo: !currentStatus } : a))
      toast.success("Estado actualizado")
    }
  }

  // Actualizar el monto de un precio NO pisa el valor anterior: cierra el precio
  // vigente (vigente_hasta = hoy) e inserta uno nuevo (vigente_desde = hoy). Así
  // las designaciones ya cargadas con fechas viejas siguen viendo el precio que
  // regía en ese momento, y el valor anterior queda en el historial.
  const handleSavePrecio = async (precio: Precio, nuevoMonto: number) => {
    if (nuevoMonto === precio.monto) return
    const hoy = format(new Date(), "yyyy-MM-dd")

    try {
      const { error: errClose } = await supabase
        .from('precios')
        .update({ vigente_hasta: hoy })
        .eq('id', precio.id)
      if (errClose) throw errClose

      const { data: nuevo, error: errInsert } = await supabase
        .from('precios')
        .insert({ liga_id: precio.liga_id, rol: precio.rol, monto: nuevoMonto, vigente_desde: hoy })
        .select()
        .single()
      if (errInsert) throw errInsert

      setPrecios(prev => [
        ...prev.map(p => p.id === precio.id ? { ...p, vigente_hasta: hoy } : p),
        nuevo
      ])
      toast.success("Precio actualizado. El valor anterior queda en el historial")
    } catch (error) {
      toast.error("Error al guardar precio")
    }
  }

  const handleSaveViatico = async (viatico: Viatico, nuevoMonto: number, nuevaLocalidad: string) => {
    const localidadFinal = nuevaLocalidad.trim()
    const localidadCambio = localidadFinal !== viatico.localidad
    const montoCambio = nuevoMonto !== viatico.monto
    if (!localidadCambio && !montoCambio) return

    try {
      // Renombrar es metadata, no versiona: se aplica a toda la localidad (vigente + historial)
      if (localidadCambio) {
        const { error } = await supabase
          .from('viaticos')
          .update({ localidad: localidadFinal })
          .eq('localidad', viatico.localidad)
        if (error) throw error
        setViaticos(prev => prev.map(v => v.localidad === viatico.localidad ? { ...v, localidad: localidadFinal } : v))
      }

      // Cambiar el monto sí versiona: cierra el vigente e inserta uno nuevo
      if (montoCambio) {
        const hoy = format(new Date(), "yyyy-MM-dd")

        const { error: errClose } = await supabase
          .from('viaticos')
          .update({ vigente_hasta: hoy })
          .eq('id', viatico.id)
        if (errClose) throw errClose

        const { data: nuevo, error: errInsert } = await supabase
          .from('viaticos')
          .insert({ localidad: localidadFinal, monto: nuevoMonto, vigente_desde: hoy })
          .select()
          .single()
        if (errInsert) throw errInsert

        setViaticos(prev => [
          ...prev.map(v => v.id === viatico.id ? { ...v, vigente_hasta: hoy, localidad: localidadFinal } : v),
          nuevo
        ])
      }

      toast.success(montoCambio ? "Viático actualizado. El valor anterior queda en el historial" : "Localidad renombrada")
    } catch (error) {
      toast.error("Error al guardar viático")
    }
  }

  const handleToggleLiga = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('ligas')
      .update({ activo: !currentStatus })
      .eq('id', id)

    if (error) {
      toast.error("Error al actualizar estado del torneo")
    } else {
      setLigas(prev => prev.map(l => l.id === id ? { ...l, activo: !currentStatus } : l))
      toast.success("Estado del torneo actualizado")
    }
  }

  const handleUpdateLigaName = async (id: string, nuevoNombre: string) => {
    if (!nuevoNombre.trim()) return

    const { error } = await supabase
      .from('ligas')
      .update({ nombre: nuevoNombre.trim() })
      .eq('id', id)

    if (error) {
      toast.error("Error al actualizar nombre del torneo")
    } else {
      setLigas(prev => prev.map(l => l.id === id ? { ...l, nombre: nuevoNombre.trim() } : l))
      toast.success("Nombre de torneo actualizado")
    }
  }

  // El nombre del rol es metadata, no versiona: renombrar aplica a todo el
  // historial de precios de ese rol (si no, el historial quedaría "huérfano"
  // agrupado bajo el nombre viejo).
  const handleUpdateRolName = async (ligaId: string, rolActual: string, nuevoNombre: string) => {
    const nombre = nuevoNombre.trim()
    if (!nombre || nombre === rolActual) return

    const { error } = await supabase
      .from('precios')
      .update({ rol: nombre })
      .eq('liga_id', ligaId)
      .eq('rol', rolActual)

    if (error) {
      toast.error("Error al actualizar nombre del rol")
    } else {
      setPrecios(prev => prev.map(p => (p.liga_id === ligaId && p.rol === rolActual) ? { ...p, rol: nombre } : p))
      toast.success("Nombre de rol actualizado")
    }
  }

  const handleDeleteArbitro = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas borrar este árbitro? Esta acción no se puede deshacer.")) return

    const { error } = await supabase
      .from('arbitros')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error al borrar árbitro. Es posible que tenga designaciones asociadas.")
    } else {
      setArbitros(prev => prev.filter(a => a.id !== id))
      toast.success("Árbitro eliminado")
    }
  }

  const handleDeleteLiga = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas borrar este torneo? Se borrarán también todos sus precios configurados.")) return

    // Primero borramos los precios (en caso de que no haya cascada en DB)
    await supabase.from('precios').delete().eq('liga_id', id)

    const { error } = await supabase
      .from('ligas')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error al borrar torneo. Es posible que tenga designaciones asociadas.")
    } else {
      setLigas(prev => prev.filter(l => l.id !== id))
      setPrecios(prev => prev.filter(p => p.liga_id !== id))
      toast.success("Torneo eliminado")
    }
  }

  const handleDeleteViatico = async (localidad: string) => {
    if (!confirm(`¿Estás seguro de que deseas borrar "${localidad}" (incluyendo su historial de montos)?`)) return

    const { error } = await supabase
      .from('viaticos')
      .delete()
      .eq('localidad', localidad)

    if (error) {
      toast.error("Error al borrar localidad")
    } else {
      setViaticos(prev => prev.filter(v => v.localidad !== localidad))
      toast.success("Localidad eliminada")
    }
  }

  const getLigaNombre = (id: string) => ligas.find(l => l.id === id)?.nombre || id

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand">Configuración</h2>
          <p className="text-muted-foreground">Administración de árbitros, honorarios y viáticos.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="arbitros" className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:w-[600px] mb-8">
          <TabsTrigger value="arbitros" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Árbitros</span>
          </TabsTrigger>
          <TabsTrigger value="torneos" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Torneos</span>
          </TabsTrigger>
          <TabsTrigger value="precios" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Honorarios</span>
          </TabsTrigger>
          <TabsTrigger value="viaticos" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Viáticos</span>
          </TabsTrigger>
          <TabsTrigger value="deudas" className="gap-2 text-red-600 data-[state=active]:bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Deudas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arbitros">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lista de Árbitros</CardTitle>
                <CardDescription>Habilita o deshabilita árbitros para la carga rápida.</CardDescription>
              </div>
              <Button 
                className="bg-brand hover:bg-brand-hover gap-2"
                onClick={() => setIsModalArbitroOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-[80px] text-center">Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arbitros.map((arbitro) => (
                      <TableRow key={arbitro.id}>
                        <TableCell className="font-medium">{arbitro.nombre}</TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={arbitro.activo} 
                            onCheckedChange={() => handleToggleArbitro(arbitro.id, arbitro.activo)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-zinc-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteArbitro(arbitro.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="torneos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Torneos</CardTitle>
                <CardDescription>Crea y modifica las ligas disponibles en el sistema.</CardDescription>
              </div>
              <Button 
                className="bg-brand hover:bg-brand-hover gap-2"
                onClick={() => setIsModalTorneoOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Nuevo Torneo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border text-xs sm:text-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del Torneo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-[80px] text-center">Estado</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ligas.map((liga) => (
                      <TableRow key={liga.id}>
                        <TableCell className="p-2">
                          <Input 
                            defaultValue={liga.nombre}
                            onBlur={(e) => handleUpdateLigaName(liga.id, e.target.value)}
                            className="h-8 border-transparent hover:border-zinc-200 focus:border-zinc-300 font-bold"
                          />
                        </TableCell>
                        <TableCell className="capitalize py-0">{liga.tipo.replace('_', ' ')}</TableCell>
                        <TableCell className="text-center">
                          <Switch 
                            checked={liga.activo} 
                            onCheckedChange={() => handleToggleLiga(liga.id, liga.activo)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-zinc-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteLiga(liga.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="precios">
          <Card>
            <CardHeader>
              <CardTitle>Tabla de Honorarios</CardTitle>
              <CardDescription>Ajusta el valor por partido para cada categoría y rol.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Liga</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="w-[150px]">Monto</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agruparPrecios(precios).map((g) => (
                      <FilaPrecioGrupo
                        key={`${g.ligaId}::${g.rol}::${g.vigente.id}`}
                        grupo={g}
                        ligaNombre={getLigaNombre(g.ligaId)}
                        onSaveMonto={(val) => handleSavePrecio(g.vigente, val)}
                        onSaveRol={(val) => handleUpdateRolName(g.ligaId, g.rol, val)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viaticos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Viáticos</CardTitle>
                <CardDescription>Configura los costos de traslado por localidad.</CardDescription>
              </div>
              <Button 
                className="bg-brand hover:bg-brand-hover gap-2"
                onClick={() => setIsModalLocalidadOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Nueva Localidad
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Localidad</TableHead>
                      <TableHead className="w-[200px]">Monto</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agruparViaticos(viaticos).map((g) => (
                      <FilaViaticoGrupo
                        key={`${g.localidad}::${g.vigente.id}`}
                        grupo={g}
                        onSave={(val, loc) => handleSaveViatico(g.vigente, val, loc)}
                        onDelete={() => handleDeleteViatico(g.localidad)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deudas">
          <GestionDeudas arbitros={arbitros} />
        </TabsContent>
      </Tabs>

      <ModalNuevoArbitro 
        isOpen={isModalArbitroOpen} 
        onClose={() => setIsModalArbitroOpen(false)} 
        onSuccess={fetchData} 
      />
      <ModalNuevoTorneo 
        isOpen={isModalTorneoOpen} 
        onClose={() => setIsModalTorneoOpen(false)} 
        onSuccess={fetchData} 
      />
      <ModalNuevaLocalidad
        isOpen={isModalLocalidadOpen}
        onClose={() => setIsModalLocalidadOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}

function FilaPrecioGrupo({ grupo, ligaNombre, onSaveMonto, onSaveRol }: {
  grupo: GrupoPrecio,
  ligaNombre: string,
  onSaveMonto: (val: number) => void,
  onSaveRol: (val: string) => void
}) {
  const { vigente, historial } = grupo
  // key={vigente.id} en el llamador remonta este componente (y resetea el estado
  // local) cada vez que se cierra el precio vigente y se abre uno nuevo.
  const [value, setValue] = useState(vigente.monto)
  const [rol, setRol] = useState(vigente.rol)
  const [hasChanged, setHasChanged] = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)

  const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value) || 0
    setValue(newVal)
    setHasChanged(newVal !== vigente.monto || rol !== vigente.rol)
  }

  const handleChangeRol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRol = e.target.value
    setRol(newRol)
    setHasChanged(newRol !== vigente.rol || value !== vigente.monto)
  }

  const handleSave = () => {
    if (value !== vigente.monto) onSaveMonto(value)
    if (rol !== vigente.rol) onSaveRol(rol)
    setHasChanged(false)
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-semibold">{ligaNombre}</TableCell>
        <TableCell>
          <Input
            value={rol}
            onChange={handleChangeRol}
            className="h-8 border-transparent hover:border-zinc-200 focus:border-zinc-300 font-medium"
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input
              type="number"
              value={value}
              onChange={handleChangeValue}
              className="h-8 py-0"
            />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={hasChanged ? "default" : "ghost"}
              disabled={!hasChanged}
              onClick={handleSave}
              className={hasChanged ? "bg-brand hover:bg-brand-hover" : ""}
            >
              <Save className="h-4 w-4" />
            </Button>
            {historial.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400 hover:text-brand gap-1"
                onClick={() => setShowHistorial(v => !v)}
              >
                <History className="h-4 w-4" />
                <ChevronDown className={cn("h-3 w-3 transition-transform", showHistorial && "rotate-180")} />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {showHistorial && historial.length > 0 && (
        <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
          <TableCell colSpan={4} className="py-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Historial de montos</div>
            <div className="space-y-1">
              {historial.map(h => (
                <div key={h.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-white border border-zinc-100">
                  <span className="text-zinc-500 font-medium">
                    {formatFecha(h.vigente_desde)} — {h.vigente_hasta ? formatFecha(h.vigente_hasta) : "hoy"}
                  </span>
                  <span className="font-bold text-zinc-700">{formatARS(h.monto)}</span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function FilaViaticoGrupo({ grupo, onSave, onDelete }: {
  grupo: GrupoViatico,
  onSave: (val: number, loc: string) => void,
  onDelete: () => void
}) {
  const { vigente, historial } = grupo
  // key={vigente.id} en el llamador remonta este componente (y resetea el estado
  // local) cada vez que se cierra el viático vigente y se abre uno nuevo.
  const [value, setValue] = useState(vigente.monto)
  const [localidad, setLocalidad] = useState(vigente.localidad)
  const [hasChanged, setHasChanged] = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value) || 0
    setValue(newVal)
    setHasChanged(newVal !== vigente.monto || localidad !== vigente.localidad)
  }

  const handleLocalidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLoc = e.target.value
    setLocalidad(newLoc)
    setHasChanged(newLoc !== vigente.localidad || value !== vigente.monto)
  }

  const handleSave = () => {
    onSave(value, localidad)
    setHasChanged(false)
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-semibold p-2">
          <Input
            value={localidad}
            onChange={handleLocalidadChange}
            className="h-8 border-transparent hover:border-zinc-200 focus:border-zinc-300 transition-all font-bold"
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input
              type="number"
              value={value}
              onChange={handleMontoChange}
              className="h-8 py-0"
            />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={hasChanged ? "default" : "ghost"}
              disabled={!hasChanged}
              onClick={handleSave}
              className={hasChanged ? "bg-brand hover:bg-brand-hover" : ""}
            >
              <Save className="h-4 w-4" />
            </Button>
            {historial.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400 hover:text-brand gap-1"
                onClick={() => setShowHistorial(v => !v)}
              >
                <History className="h-4 w-4" />
                <ChevronDown className={cn("h-3 w-3 transition-transform", showHistorial && "rotate-180")} />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-300 hover:text-red-500 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {showHistorial && historial.length > 0 && (
        <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
          <TableCell colSpan={3} className="py-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">Historial de montos</div>
            <div className="space-y-1">
              {historial.map(h => (
                <div key={h.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-white border border-zinc-100">
                  <span className="text-zinc-500 font-medium">
                    {formatFecha(h.vigente_desde)} — {h.vigente_hasta ? formatFecha(h.vigente_hasta) : "hoy"}
                  </span>
                  <span className="font-bold text-zinc-700">{formatARS(h.monto)}</span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
