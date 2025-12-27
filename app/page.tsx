import { TodoAppClient } from "./todo-app-client"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"

export default function Home() {
  // Wir laden keine initialen Daten mehr vom Server.
  // Die App startet mit einer leeren Liste.
  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex justify-end mb-4 gap-2">
          <UserMenu />
          <ThemeToggle />
        </header>
        {/* Die Client-Komponente erhält keine initialen Todos mehr als Prop. */}
        <TodoAppClient />
      </div>
    </main>
  )
}
