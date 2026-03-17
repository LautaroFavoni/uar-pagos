import { Navigation } from "@/components/shared/Navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navigation />
      <main className="md:ml-64 p-4 md:p-10 pb-24 md:pb-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
