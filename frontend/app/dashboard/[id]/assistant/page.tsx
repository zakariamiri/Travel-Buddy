'use client'

import { useMemo, useState } from 'react'
import {
  Bot,
  CalendarDays,
  CircleDollarSign,
  Loader2,
  MapPin,
  MessageCircle,
  Plane,
  Send,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTripContext } from '@/components/TripProvider'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/LanguageProvider'

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
  const { t } = useLanguage()
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
    <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#fff4df_0%,#fdf9f6_38%,#f7efe8_100%)] pb-6 md:pb-8">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 p-5 pb-8 md:p-8 md:pb-10">
        <header className="overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-[0_18px_45px_rgba(127,42,7,0.10)]">
          <div className="flex flex-col justify-between gap-5 bg-[linear-gradient(135deg,#fffaf4_0%,#ffffff_52%,#f3e4da_100%)] p-5 md:flex-row md:items-center md:p-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff1d6] px-3 py-1 text-xs font-bold text-[#8a3412] shadow-sm">
              <Sparkles className="size-3.5 text-[#d4a843]" />
              Travel AI
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              {t("assistantPageTitle")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t("assistantPageText")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-[#ead9bf] bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
              <WalletCards className="mb-2 size-4 text-[#9f411d]" />
              <p className="text-xs text-muted-foreground">{t("budget")}</p>
              <p className="text-sm font-bold">{Math.round(tripContext.totalBudget)} {tripContext.currency}</p>
            </div>
            <div className="rounded-lg border border-[#ead9bf] bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
              <Users className="mb-2 size-4 text-[#9f411d]" />
              <p className="text-xs text-muted-foreground">{t("members")}</p>
              <p className="text-sm font-bold">{tripContext.numberOfMembers}</p>
            </div>
            <div className="rounded-lg border border-[#ead9bf] bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
              <CalendarDays className="mb-2 size-4 text-[#9f411d]" />
              <p className="text-xs text-muted-foreground">{t("duration")}</p>
              <p className="text-sm font-bold">{tripContext.durationDays} jours</p>
            </div>
            <div className="rounded-lg border border-[#ead9bf] bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
              <Bot className="mb-2 size-4 text-[#9f411d]" />
              <p className="text-xs text-muted-foreground">{t("level")}</p>
              <p className="text-sm font-bold">{tripContext.budgetLevel}</p>
            </div>
          </div>
          </div>
        </header>

        <section className="mb-6 grid min-h-[620px] gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-[0_14px_35px_rgba(127,42,7,0.10)]">
            <div className="bg-[linear-gradient(135deg,#9f411d,#c9603a)] p-5 text-white">
              <div className="relative flex size-14 items-center justify-center rounded-full bg-white/15 shadow-inner">
                <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                <Bot className="relative size-7" />
              </div>
              <h2 className="mt-5 text-lg font-bold">{t("tripContext")}</h2>
              <p className="mt-1 text-sm text-white/75">
                {tripDetails?.name || 'Travel Buddy Trip'}
              </p>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <div className="rounded-lg border border-[#ead9bf] bg-[#fff8ec] p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-[#9f411d]">
                  <MapPin className="size-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">{t("destination")}</p>
                </div>
                <p className="font-bold text-foreground">{tripContext.destination}</p>
              </div>
              <div className="rounded-lg border border-[#ead9bf] bg-[#fff8ec] p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-[#9f411d]">
                  <CircleDollarSign className="size-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">{t("budgetPerPersonDay")}</p>
                </div>
                <p className="font-bold text-foreground">
                  {Math.round(tripContext.budgetPerDay)} {tripContext.currency}
                </p>
              </div>
              <div className="rounded-lg border border-[#ead9bf] bg-[#fff8ec] p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-[#9f411d]">
                  <Plane className="size-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">{t("appliedRule")}</p>
                </div>
                <p className="font-bold text-foreground">{tripContext.budgetLevel}</p>
              </div>

              <div className="rounded-lg border border-dashed border-[#d8bda7] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt ideas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Restaurants', 'Budget', 'Transport', 'Planning'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="rounded-full bg-[#f3e4da] px-3 py-1 text-xs font-bold text-[#7f2a07] transition hover:bg-[#9f411d] hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#ead9bf] bg-white shadow-[0_14px_35px_rgba(127,42,7,0.10)]">
            <div className="flex items-center justify-between border-b border-[#ead9bf] bg-[#fffaf4] px-5 py-4">
              <div>
              <h2 className="font-bold">{t("discussion")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("assistantUsesBudget")}
              </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[#ead9bf] bg-white px-3 py-1.5 text-xs font-bold text-[#7f2a07] sm:flex">
                <MessageCircle className="size-3.5" />
                Live chat
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fffefd_0%,#fff8ec_100%)] p-5">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#9f411d] text-white shadow-sm">
                      <Bot className="size-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed shadow-sm ${message.role === 'user'
                        ? 'rounded-2xl rounded-tr-md bg-[#9f411d] text-white shadow-[0_10px_22px_rgba(159,65,29,0.18)]'
                        : 'rounded-2xl rounded-tl-md border border-[#ead9bf] bg-white text-foreground'
                      }`}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f3e4da] text-[#7f2a07] shadow-sm">
                      <Users className="size-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start gap-3">
                  <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#9f411d] text-white shadow-sm">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-[#ead9bf] bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
                    <Loader2 className="size-4 animate-spin" />
                    {t("assistantThinking")}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#ead9bf] bg-white p-4">
              <div className="flex items-end gap-3 rounded-lg border border-[#ead9bf] bg-[#fffaf4] p-2 shadow-inner">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={t("assistantPlaceholder")}
                  rows={1}
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-md border-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/75"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="h-11 rounded-lg bg-[#9f411d] px-4 text-sm font-bold text-white shadow-[0_10px_20px_rgba(159,65,29,0.20)] hover:bg-[#7f3417]"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  <span className="hidden sm:inline">{t("send")}</span>
                </Button>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
