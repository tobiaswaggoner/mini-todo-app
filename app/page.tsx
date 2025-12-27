import { TodoAppClient } from "./todo-app-client"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  // Wir laden keine initialen Daten mehr vom Server.
  // Die App startet mit einer leeren Liste.
  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Mini Todo Planner</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Organisieren Sie Ihren Tag, Aufgabe für Aufgabe.
          </p>
        </header>
        {/* Die Client-Komponente erhält keine initialen Todos mehr als Prop. */}
        <TodoAppClient />
      </div>
    </main>
  )
}
