"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error("Error al iniciar sesión", {
          description: error.message === "Invalid login credentials" 
            ? "Credenciales inválidas" 
            : error.message
        })
      } else {
        toast.success("¡Bienvenido!")
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md border-t-8 border-t-[#003399] shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-1 text-center pb-8 pt-10">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-3xl shadow-xl shadow-blue-100 border border-blue-50">
              <img src="/uar-logo.png" alt="UAR logo" className="h-20 w-20 object-contain" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black italic tracking-tighter text-[#003399]">
            COLEGIO DE ÁRBITROS
          </CardTitle>
          <CardDescription className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
            Sistema de Gestión de Pagos UAR
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@colegio.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="focus-visible:ring-[#003399] h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="focus-visible:ring-[#003399] h-12 rounded-xl"
              />
            </div>
          </CardContent>
          <CardFooter className="pb-10">
            <Button 
              type="submit" 
              className="w-full bg-[#003399] hover:bg-[#002266] text-white font-black italic italic py-7 text-xl rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? "Iniciando..." : "INGRESAR"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
