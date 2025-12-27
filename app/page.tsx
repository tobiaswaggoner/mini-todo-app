import { TodoAppClient } from "./todo-app-client"

export default function Home() {
  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-dvh flex flex-col">
      <TodoAppClient />
    </main>
  )
}
