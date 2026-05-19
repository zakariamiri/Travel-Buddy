'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  CreditCard,
  Landmark,
  Plus,
  ReceiptText,
  Users,
  WalletCards,
} from 'lucide-react'
import { useTripContext } from '@/components/TripProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiUrl } from '@/lib/api'

type Expense = {
  id: string
  title: string
  amount: number
  paidById: string
  paidByName: string
  category: string
  date: string
}

type Member = {
  id: string
  name: string
  role?: string
}

const currencyFormatter = new Intl.NumberFormat('fr-MA', {
  maximumFractionDigits: 0,
})

function formatMoney(value: number) {
  return `${currencyFormatter.format(Math.max(0, value))} DH`
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export default function BudgetPage() {
  const { activities, currentToken, tripDetails } = useTripContext()
  const membersCount = Math.max(1, tripDetails?.membersCount ?? 4)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [savingExpense, setSavingExpense] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    paidBy: '',
    category: 'Activity',
    date: new Date().toISOString().split('T')[0],
  })

  const members: Member[] = useMemo(() => {
    return (tripDetails?.members || [])
      .filter((member) => Boolean(member.id))
      .map((member) => ({
        id: member.id as string,
        name: member.full_name || member.email || 'Member',
        role: member.role,
      }))
      .sort((a, b) => (a.role === 'owner' ? -1 : 0) - (b.role === 'owner' ? -1 : 0))
  }, [tripDetails?.members])

  const memberNameById = useMemo(() => {
    return members.reduce<Record<string, string>>((acc, member) => {
      acc[member.id] = member.name
      return acc
    }, {})
  }, [members])

  const activityRows = useMemo(() => {
    return activities.map((activity) => {
      const pricePerPerson = toNumber(
        activity.price_per_person ?? activity.pricePerPerson
      )
      const participantCount = toNumber(
        activity.participant_count ?? activity.participantCount ?? activity.voteCount,
        activity.voteCount || membersCount
      )

      return {
        ...activity,
        pricePerPerson,
        participantCount,
        total: pricePerPerson * participantCount,
      }
    })
  }, [activities, membersCount])

  const selectedPaidBy = formData.paidBy || members[0]?.id || ''
  const customCategories = ['Food', 'Transport', 'Hotel', 'Shopping', 'Other']

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!tripDetails?.id || !currentToken) return

      try {
        const response = await fetch(apiUrl(`/api/trips/${tripDetails.id}/expenses`), {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        })
        if (!response.ok) throw new Error('Failed to fetch expenses')
        const data = await response.json()
        const normalizedExpenses = (Array.isArray(data) ? data : []).map((expense) => ({
          id: expense.id,
          title: expense.label || expense.title,
          amount: toNumber(expense.amount),
          paidById: expense.paid_by || expense.paidBy,
          paidByName: memberNameById[expense.paid_by || expense.paidBy] || 'Member',
          category: expense.category || 'General',
          date: expense.date,
        }))
        setExpenses(normalizedExpenses)
      } catch (error) {
        console.error('Error fetching expenses:', error)
      }
    }

    fetchExpenses()
  }, [currentToken, memberNameById, tripDetails?.id])

  const estimatedTotal = activityRows.reduce((sum, activity) => sum + activity.total, 0)
  const spentTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const budgetTotal = toNumber(tripDetails?.budget_total ?? tripDetails?.budget, 5000)
  const remainingBudget = Math.max(0, budgetTotal - spentTotal)
  const progressValue = Math.min(100, Math.round((spentTotal / Math.max(1, budgetTotal)) * 100))
  const mainPayer = expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.paidById] = (acc[expense.paidById] || 0) + expense.amount
    return acc
  }, {})
  const balanceMembers = members.length ? members : [{ id: 'unknown', name: 'Member' }]
  const sharePerMember = spentTotal / balanceMembers.length
  const balances = (() => {
    const debtors = balanceMembers
      .map((member) => ({
        ...member,
        amount: sharePerMember - (mainPayer[member.id] || 0),
      }))
      .filter((member) => member.amount > 0.5)
      .sort((a, b) => b.amount - a.amount)
    const creditors = balanceMembers
      .map((member) => ({
        ...member,
        amount: (mainPayer[member.id] || 0) - sharePerMember,
      }))
      .filter((member) => member.amount > 0.5)
      .sort((a, b) => b.amount - a.amount)
    const transfers: Array<{ from: string; to: string; amount: number }> = []

    debtors.forEach((debtor) => {
      let remaining = debtor.amount
      creditors.forEach((creditor) => {
        if (remaining <= 0.5 || creditor.amount <= 0.5) return
        const amount = Math.min(remaining, creditor.amount)
        transfers.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount),
        })
        remaining -= amount
        creditor.amount -= amount
      })
    })

    return transfers
  })()

  const handleAddExpense = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(formData.amount)
    if (!formData.title || !Number.isFinite(amount) || amount <= 0 || !selectedPaidBy || !tripDetails?.id || !currentToken) return

    setSavingExpense(true)
    try {
      const response = await fetch(apiUrl(`/api/trips/${tripDetails.id}/expenses`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          label: formData.title,
          amount,
          paid_by: selectedPaidBy,
          category: formData.category,
          date: formData.date,
          split_between: members.map((member) => member.id),
        }),
      })
      if (!response.ok) throw new Error('Failed to create expense')
      const expense = await response.json()

      setExpenses((current) => [
        {
          id: expense.id,
          title: expense.label || expense.title,
          amount: toNumber(expense.amount),
          paidById: expense.paid_by || expense.paidBy,
          paidByName: memberNameById[expense.paid_by || expense.paidBy] || 'Member',
          category: expense.category || formData.category,
          date: expense.date,
        },
        ...current,
      ])
      setFormData((current) => ({ ...current, title: '', amount: '' }))
    } catch (error) {
      console.error('Error creating expense:', error)
    } finally {
      setSavingExpense(false)
    }
  }

  const statCards = [
    {
      label: 'Budget total du trip',
      value: formatMoney(budgetTotal),
      icon: WalletCards,
      className: 'bg-primary/10 text-primary',
    },
    {
      label: 'Montant depense',
      value: formatMoney(spentTotal),
      icon: CreditCard,
      className: 'bg-accent/20 text-[#9f411d]',
    },
    {
      label: 'Budget restant',
      value: formatMoney(remainingBudget),
      icon: Coins,
      className: 'bg-secondary/10 text-secondary',
    },
  ]

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 md:p-8">
        <header className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-xs font-semibold text-primary">
              <WalletCards className="size-3.5" />
              Travel Budget
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              Budget & Expenses
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Suivez le budget du voyage, les estimations par activite et les depenses reellement payees.
            </p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-muted-foreground">Trip</span>
            <p className="font-semibold text-foreground">{tripDetails?.name || 'Travel Buddy Trip'}</p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-lg border bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex size-11 items-center justify-center rounded-lg ${card.className}`}>
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            )
          })}
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">Budget utilise</h2>
              <p className="text-sm text-muted-foreground">{formatMoney(spentTotal)} depenses sur {formatMoney(budgetTotal)}</p>
            </div>
            <span className="rounded-full bg-sidebar px-3 py-1 text-sm font-bold text-primary">{progressValue}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-700"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">Estimated Activities Cost</h2>
                <p className="text-sm text-muted-foreground">Total = prix par personne x participants ou votes.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-sm font-semibold text-primary">
                <CircleDollarSign className="size-4" />
                {formatMoney(estimatedTotal)}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <div className="hidden grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr] bg-sidebar/70 px-4 py-3 text-xs font-bold uppercase text-muted-foreground md:grid">
                <span>Nom activite</span>
                <span>Prix/personne</span>
                <span>Participants</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y">
                {activityRows.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Aucune activite disponible pour estimer le budget.
                  </div>
                ) : activityRows.map((activity) => (
                  <div
                    key={activity.id}
                    className="grid gap-3 px-4 py-4 transition hover:bg-sidebar/30 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Landmark className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.location || activity.type}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-semibold text-[#8a3412] md:w-fit">
                      {formatMoney(activity.pricePerPerson)}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      <Users className="size-4 text-secondary" />
                      {activity.participantCount} participants
                    </span>
                    <span className="text-left text-lg font-bold text-foreground md:text-right">
                      {formatMoney(activity.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-foreground">Member Balances</h2>
            <p className="mb-5 text-sm text-muted-foreground">Qui doit payer et qui doit recevoir.</p>
            <div className="space-y-3">
              {balances.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-sidebar/30 p-5 text-center text-sm text-muted-foreground">
                  Aucun solde a regler pour le moment.
                </div>
              ) : balances.map((balance) => (
                <div key={`${balance.from}-${balance.to}`} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <ArrowUpRight className="mt-1 size-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {balance.from} doit payer {formatMoney(balance.amount)} a {balance.to}
                      </p>
                      <p className="text-xs text-muted-foreground">Split automatique des depenses reelles.</p>
                    </div>
                  </div>
                  <Button className="mt-3 w-full bg-primary text-white hover:bg-primary/90">
                    <CheckCircle2 className="size-4" />
                    Mark as paid
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleAddExpense} className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Plus className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Real Expenses</h2>
                <p className="text-sm text-muted-foreground">Ajouter une depense reelle.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="expense-title">Titre</Label>
                <Input
                  id="expense-title"
                  value={formData.title}
                  onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Hotel, restaurant, tickets..."
                  className="mt-2 bg-white focus-visible:ring-primary/30"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="expense-amount">Montant</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="300"
                    className="mt-2 bg-white focus-visible:ring-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={formData.date}
                    onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))}
                    className="mt-2 bg-white focus-visible:ring-primary/30"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Paye par</Label>
                  <Select value={selectedPaidBy} onValueChange={(value) => setFormData((current) => ({ ...current, paidBy: value || current.paidBy }))}>
                    <SelectTrigger className="mt-2 w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {members.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Aucun membre disponible
                        </div>
                      ) : members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{member.name}</span>
                            <span className="rounded-full bg-sidebar px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              {member.role === 'owner' ? 'Admin' : 'Member'}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categorie</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData((current) => ({ ...current, category: value || current.category }))}>
                    <SelectTrigger className="mt-2 w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                        Activities created
                      </div>
                      {activityRows.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Aucune activite creee
                        </div>
                      ) : activityRows.map((activity) => (
                        <SelectItem key={activity.id} value={`Activity: ${activity.title}`}>
                          {activity.title}
                        </SelectItem>
                      ))}
                      <div className="mt-1 border-t px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                        Choices
                      </div>
                      {customCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button disabled={savingExpense} className="bg-primary text-white hover:bg-primary/90">
                <ReceiptText className="size-4" />
                {savingExpense ? 'Saving...' : 'Add expense'}
              </Button>
            </div>
          </form>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">Expenses List</h2>
                <p className="text-sm text-muted-foreground">Historique des paiements reels.</p>
              </div>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                {expenses.length} entries
              </span>
            </div>

            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-sidebar/30 p-6 text-center text-sm text-muted-foreground">
                  Aucune depense reelle ajoutee pour le moment.
                </div>
              ) : expenses.map((expense) => (
                <div key={expense.id} className="flex flex-col gap-3 rounded-lg border bg-white p-4 transition hover:bg-sidebar/30 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ArrowDownLeft className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{expense.title}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {expense.date} - {expense.category} - paid by {expense.paidByName}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground">{formatMoney(expense.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
