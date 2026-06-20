'use client'

import { useMemo, useState } from 'react'
import {
  Bot,
  CalendarDays,
  Loader2,
  Send,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTripContext } from '@/components/TripProvider'
import { Button } from '@/components/ui/button'

type Message = {
  role: 'assistant' | 'user'
  content: string
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function getDurationDays(startDate?: string, endDate?: string) {
  if (!startDate) return 1
  const start = new Date(startDate)
  const end = new Date(endDate || startDate)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, diff)
}

export default function AssistantPage() {
  const { tripDetails } = useTripContext()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Bonjour, je suis l'assistant Travel-Buddy. Pose-moi une question sur les activites, le budget, l'itineraire ou les depenses du voyage.",
    },
  ])

  const tripContext = useMemo(() => {
    const totalBudget = toNumber(
      tripDetails?.budget_total ?? tripDetails?.budget,
      5000,
    )
    const numberOfMembers = Math.max(1, tripDetails?.membersCount || tripDetails?.members?.length || 1)
    const durationDays = getDurationDays(tripDetails?.start_date, tripDetails?.end_date)
    const budgetPerDay = totalBudget / numberOfMembers / durationDays
    const budgetLevel = budgetPerDay < 300 ? 'Economique' : budgetPerDay <= 800 ? 'Moyen' : 'Premium'

    return {
      destination: tripDetails?.destination || 'Destination',
      totalBudget,
      currency: 'MAD',
      numberOfMembers,
      durationDays,
      budgetPerDay,
      budgetLevel,
    }
  }, [tripDetails])

  const handleSend = async () => {
    const message = input.trim()
    if (!message || loading) return

    setInput('')
    setMessages((current) => [...current, { role: 'user', content: message }])
    setLoading(true)

    try {
      const response = await fetch('/api/travel-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          destination: tripContext.destination,
          totalBudget: tripContext.totalBudget,
          currency: tripContext.currency,
          numberOfMembers: tripContext.numberOfMembers,
          durationDays: tripContext.durationDays,
          includeContext: messages.filter((item) => item.role === 'user').length === 0,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "L'assistant n'a pas pu repondre")
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.answer || 'Aucune reponse recue.',
        },
      ])

      if (data.offline) {
        toast.warning("API Python non lancee: reponse locale affichee.")
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur assistant."
      toast.error(message)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            "Je n'arrive pas a joindre l'assistant pour le moment. Verifie que l'API Python est lancee sur http://localhost:8000.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background pb-6 md:pb-8">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 p-5 pb-8 md:p-8 md:pb-10">
        <header className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Travel AI
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              Assistant Travel-Buddy
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Demande des recommandations adaptees au budget total, aux membres et a la duree du voyage.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
              <WalletCards className="mb-2 size-4 text-primary" />
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-bold">{Math.round(tripContext.totalBudget)} {tripContext.currency}</p>
            </div>
            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
              <Users className="mb-2 size-4 text-primary" />
              <p className="text-xs text-muted-foreground">Membres</p>
              <p className="text-sm font-bold">{tripContext.numberOfMembers}</p>
            </div>
            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
              <CalendarDays className="mb-2 size-4 text-primary" />
              <p className="text-xs text-muted-foreground">Duree</p>
              <p className="text-sm font-bold">{tripContext.durationDays} jours</p>
            </div>
            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
              <Bot className="mb-2 size-4 text-primary" />
              <p className="text-xs text-muted-foreground">Niveau</p>
              <p className="text-sm font-bold">{tripContext.budgetLevel}</p>
            </div>
          </div>
        </header>

        <section className="mb-6 grid min-h-[580px] gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-lg border border-[#ead9bf] bg-white p-5 shadow-[0_10px_30px_rgba(127,42,7,0.1)]">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#f6ddca] text-primary">
              <Bot className="size-6" />
            </div>
            <h2 className="mt-5 text-lg font-bold">Contexte du voyage</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-[#fff8ec] p-3">
                <p className="text-muted-foreground">Destination</p>
                <p className="font-semibold">{tripContext.destination}</p>
              </div>
              <div className="rounded-lg bg-[#fff8ec] p-3">
                <p className="text-muted-foreground">Budget/personne/jour</p>
                <p className="font-semibold">
                  {Math.round(tripContext.budgetPerDay)} {tripContext.currency}
                </p>
              </div>
              <div className="rounded-lg bg-[#fff8ec] p-3">
                <p className="text-muted-foreground">Regle appliquee</p>
                <p className="font-semibold">{tripContext.budgetLevel}</p>
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-lg border border-[#ead9bf] bg-white shadow-[0_10px_30px_rgba(127,42,7,0.1)]">
            <div className="border-b border-[#ead9bf] px-5 py-4">
              <h2 className="font-bold">Discussion</h2>
              <p className="text-sm text-muted-foreground">
                L&apos;assistant utilise automatiquement le budget du dashboard.
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm ${message.role === 'user'
                        ? 'bg-[#9f411d] text-white'
                        : 'border border-[#ead9bf] bg-[#fff8ec] text-foreground'
                      }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-lg border border-[#ead9bf] bg-[#fff8ec] px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Assistant en train de reflechir...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#ead9bf] p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ex: propose-moi des activites economiques pour ce voyage..."
                  rows={1}
                  className="max-h-24 min-h-11 flex-1 resize-none rounded-lg border border-[#ead9bf] bg-[#fffaf4] px-3 py-2.5 text-sm outline-none transition focus:border-[#c9603a] focus:ring-3 focus:ring-[#c9603a]/20"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="h-11 rounded-lg bg-[#9f411d] px-4 text-sm font-bold text-white hover:bg-[#7f3417]"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  <span className="hidden sm:inline">Envoyer</span>
                </Button>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
