"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Users, DollarSign, MapPin, Plus, Save, RefreshCw, Trophy } from "lucide-react"
import { Arbitro, Liga, Precio, Viatico } from "@/lib/types"
import { formatARS } from "@/lib/calculos"
import { cn } from "@/lib/utils"
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
import { Trash2 } from "lucide-react"

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

  const handleSavePrecio = async (id: string, nuevoMonto: number) => {
    const { error } = await supabase
      .from('precios')
      .update({ monto: nuevoMonto })
      .eq('id', id)

    if (error) {
      toast.error("Error al guardar precio")
    } else {
      toast.success("Precio actualizado")
    }
  }

  const handleSaveViatico = async (id: string, nuevoMonto: number, nuevaLocalidad: string) => {
    const { error } = await supabase
      .from('viaticos')
      .update({ monto: nuevoMonto, localidad: nuevaLocalidad })
      .eq('id', id)

    if (error) {
      toast.error("Error al guardar viático")
    } else {
      toast.success("Viático actualizado")
      setViaticos(prev => prev.map(v => v.id === id ? { ...v, monto: nuevoMonto, localidad: nuevaLocalidad } : v))
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

  const handleUpdateRolName = async (id: string, nuevoNombre: string) => {
    if (!nuevoNombre.trim()) return

    const { error } = await supabase
      .from('precios')
      .update({ rol: nuevoNombre.trim() })
      .eq('id', id)

    if (error) {
      toast.error("Error al actualizar nombre del rol")
    } else {
      setPrecios(prev => prev.map(p => p.id === id ? { ...p, rol: nuevoNombre.trim() } : p))
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

  const handleDeleteViatico = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas borrar esta localidad?")) return

    const { error } = await supabase
      .from('viaticos')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Error al borrar localidad")
    } else {
      setViaticos(prev => prev.filter(v => v.id !== id))
      toast.success("Localidad eliminada")
    }
  }

  const getLigaNombre = (id: string) => ligas.find(l => l.id === id)?.nombre || id

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1B5E20]">Configuración</h2>
          <p className="text-muted-foreground">Administración de árbitros, honorarios y viáticos.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Recargar
        </Button>
      </div>

      <Tabs defaultValue="arbitros" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-[500px] mb-8">
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
        </TabsList>

        <TabsContent value="arbitros">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lista de Árbitros</CardTitle>
                <CardDescription>Habilita o deshabilita árbitros para la carga rápida.</CardDescription>
              </div>
              <Button 
                className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 gap-2"
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
                className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 gap-2"
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
                    {precios.map((p) => (
                      <FilaEditable 
                        key={p.id} 
                        initialValue={p.monto} 
                        initialLabel2={p.rol}
                        label1={getLigaNombre(p.liga_id)}
                        onSave={(val) => handleSavePrecio(p.id, val)}
                        onSaveLabel2={(val) => handleUpdateRolName(p.id, val)}
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
                className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 gap-2"
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
                    {viaticos.map((v) => (
                      <FilaViaticoEditable 
                        key={v.id} 
                        initialValue={v.monto} 
                        initialLocalidad={v.localidad}
                        onSave={(val, loc) => handleSaveViatico(v.id, val, loc)}
                        onDelete={() => handleDeleteViatico(v.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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

function FilaEditable({ initialValue, initialLabel2, label1, onSave, onSaveLabel2 }: { 
  initialValue: number, 
  initialLabel2?: string,
  label1: string, 
  onSave: (val: number) => void,
  onSaveLabel2?: (val: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  const [label2, setLabel2] = useState(initialLabel2 || "")
  const [hasChanged, setHasChanged] = useState(false)

  const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value) || 0
    setValue(newVal)
    setHasChanged(newVal !== initialValue || label2 !== (initialLabel2 || ""))
  }

  const handleChangeLabel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value
    setLabel2(newLabel)
    setHasChanged(newLabel !== (initialLabel2 || "") || value !== initialValue)
  }

  const handleSave = () => {
    if (value !== initialValue) onSave(value)
    if (label2 !== initialLabel2 && onSaveLabel2) onSaveLabel2(label2)
    setHasChanged(false)
  }

  return (
    <TableRow>
      <TableCell className="font-semibold">{label1}</TableCell>
      <TableCell>
        {onSaveLabel2 ? (
          <Input 
            value={label2} 
            onChange={handleChangeLabel}
            className="h-8 border-transparent hover:border-zinc-200 focus:border-zinc-300 font-medium"
          />
        ) : (
          <span className="capitalize">{label2.replace('_', ' ')}</span>
        )}
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
        <Button 
          size="sm" 
          variant={hasChanged ? "default" : "ghost"}
          disabled={!hasChanged}
          onClick={handleSave}
          className={hasChanged ? "bg-[#1B5E20] hover:bg-[#1B5E20]/90" : ""}
        >
          <Save className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

function FilaViaticoEditable({ initialValue, initialLocalidad, onSave, onDelete }: { 
  initialValue: number, 
  initialLocalidad: string, 
  onSave: (val: number, loc: string) => void,
  onDelete: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const [localidad, setLocalidad] = useState(initialLocalidad)
  const [hasChanged, setHasChanged] = useState(false)

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value) || 0
    setValue(newVal)
    setHasChanged(newVal !== initialValue || localidad !== initialLocalidad)
  }

  const handleLocalidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLoc = e.target.value
    setLocalidad(newLoc)
    setHasChanged(newLoc !== initialLocalidad || value !== initialValue)
  }

  const handleSave = () => {
    onSave(value, localidad)
    setHasChanged(false)
  }

  return (
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
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={hasChanged ? "default" : "ghost"}
            disabled={!hasChanged}
            onClick={handleSave}
            className={hasChanged ? "bg-[#1B5E20] hover:bg-[#1B5E20]/90" : ""}
          >
            <Save className="h-4 w-4" />
          </Button>
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
  )
}
