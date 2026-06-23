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
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { ACTIVITY_TYPES } from '@/types/types'
import { useLanguage } from '@/components/LanguageProvider'

type Expense = {
  id: string
  title: string
  amount: number
  paidById: string | null
  paidByName: string
  category: string
  date: string
  splitBetween: string[]
}

type Settlement = {
  id: string
  paid_by: string
  paid_to: string
  amount: number
}

type Member = {
  id: string
  name: string
  role?: string
}

const currencyFormatter = new Intl.NumberFormat('fr-MA', {
  maximumFractionDigits: 0,
})

const SHARED_PAYMENT_VALUE = 'all-members-paid'

function formatMoney(value: number) {
  return `${currencyFormatter.format(Math.max(0, value))} DH`
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export default function BudgetPage() {
  const { t } = useLanguage()
  const { activities, currentToken, tripDetails } = useTripContext()
  const membersCount = Math.max(1, tripDetails?.membersCount ?? 4)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [settlementsAvailable, setSettlementsAvailable] = useState(true)
  const [savingExpense, setSavingExpense] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [savingBudget, setSavingBudget] = useState(false)
  const [budgetOverride, setBudgetOverride] = useState<number | null>(null)
  const [budgetInput, setBudgetInput] = useState<string | null>(null)
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
  const selectedPaidByName = selectedPaidBy === SHARED_PAYMENT_VALUE
    ? 'Tous ont paye leur part'
    : members.find((member) => member.id === selectedPaidBy)?.name || 'Select member'
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
          paidById: expense.paid_by || expense.paidBy || null,
          paidByName: expense.paid_by || expense.paidBy
            ? memberNameById[expense.paid_by || expense.paidBy] || 'Member'
            : 'Tous les membres',
          category: expense.category || 'General',
          date: expense.date,
          splitBetween: Array.isArray(expense.split_between) ? expense.split_between : [],
        }))
        setExpenses(normalizedExpenses)
      } catch (error) {
        console.error('Error fetching expenses:', error)
        toast.error('Impossible de charger les depenses')
      }
    }

    fetchExpenses()
  }, [currentToken, memberNameById, tripDetails?.id])

  useEffect(() => {
    const fetchSettlements = async () => {
      if (!tripDetails?.id || !currentToken) return

      try {
        const response = await fetch(
          apiUrl(`/api/trips/${tripDetails.id}/expenses/settlements/list`),
          { headers: { Authorization: `Bearer ${currentToken}` } },
        )
        const data = await response.json()
        if (response.status === 503 && data.code === 'SETTLEMENTS_NOT_CONFIGURED') {
          setSettlementsAvailable(false)
          setSettlements([])
          return
        }
        if (!response.ok) throw new Error(data.error || 'Failed to fetch settlements')
        setSettlementsAvailable(true)
        setSettlements(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching settlements:', error)
        toast.error('Impossible de charger les reglements')
      }
    }

    fetchSettlements()
  }, [currentToken, tripDetails?.id])

  const estimatedTotal = activityRows.reduce((sum, activity) => sum + activity.total, 0)
  const spentTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const budgetTotal = budgetOverride ?? toNumber(tripDetails?.budget_total ?? tripDetails?.budget)
  const canEditBudget = ['owner', 'admin'].includes(tripDetails?.role || '')
  const remainingBudget = Math.max(0, budgetTotal - spentTotal)
  const progressValue = Math.min(100, Math.round((spentTotal / Math.max(1, budgetTotal)) * 100))
  const balanceMembers = members.length ? members : [{ id: 'unknown', name: 'Member' }]
  const balances = (() => {
    const netByMember = balanceMembers.reduce<Record<string, number>>((acc, member) => {
      acc[member.id] = 0
      return acc
    }, {})

    expenses.forEach((expense) => {
      if (!expense.paidById) return

      const splitIds = expense.splitBetween.length
        ? expense.splitBetween.filter((id) => id in netByMember)
        : balanceMembers.map((member) => member.id)
      if (!splitIds.length) return

      netByMember[expense.paidById] = (netByMember[expense.paidById] || 0) + expense.amount
      const share = expense.amount / splitIds.length
      splitIds.forEach((memberId) => {
        netByMember[memberId] = (netByMember[memberId] || 0) - share
      })
    })

    settlements.forEach((settlement) => {
      netByMember[settlement.paid_by] =
        (netByMember[settlement.paid_by] || 0) + toNumber(settlement.amount)
      netByMember[settlement.paid_to] =
        (netByMember[settlement.paid_to] || 0) - toNumber(settlement.amount)
    })

    const debtors = balanceMembers
      .map((member) => ({
        ...member,
        amount: -(netByMember[member.id] || 0),
      }))
      .filter((member) => member.amount > 0.5)
      .sort((a, b) => b.amount - a.amount)
    const creditors = balanceMembers
      .map((member) => ({
        ...member,
        amount: netByMember[member.id] || 0,
      }))
      .filter((member) => member.amount > 0.5)
      .sort((a, b) => b.amount - a.amount)
    const transfers: Array<{
      fromId: string
      from: string
      toId: string
      to: string
      amount: number
    }> = []

    debtors.forEach((debtor) => {
      let remaining = debtor.amount
      creditors.forEach((creditor) => {
        if (remaining <= 0.5 || creditor.amount <= 0.5) return
        const amount = Math.min(remaining, creditor.amount)
        transfers.push({
          fromId: debtor.id,
          from: debtor.name,
          toId: creditor.id,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100,
        })
        remaining -= amount
        creditor.amount -= amount
      })
    })

    return transfers
  })()

  const handleSaveBudget = async () => {
    const amount = Number(budgetInput ?? budgetTotal)
    if (!canEditBudget) {
      toast.error('Seul l’admin du voyage peut modifier le budget')
      return
    }
    if (!tripDetails?.id || !currentToken || !Number.isFinite(amount) || amount < 0) {
      toast.error('Entrez un budget valide')
      return
    }

    setSavingBudget(true)
    try {
      const response = await fetch(apiUrl(`/api/trips/${tripDetails.id}/budget`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ budget_total: amount }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to update budget')
      setBudgetOverride(toNumber(result.budget_total))
      setBudgetInput(String(toNumber(result.budget_total)))
      toast.success('Budget mis a jour')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de modifier le budget')
    } finally {
      setSavingBudget(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!tripDetails?.id || !currentToken) return

    try {
      const response = await fetch(
        apiUrl(`/api/trips/${tripDetails.id}/expenses/${expenseId}`),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to delete expense')
      setExpenses((current) => current.filter((expense) => expense.id !== expenseId))
      if (editingExpenseId === expenseId) {
        cancelExpenseEdit()
      }
      toast.success('Depense supprimee')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer la depense')
    }
  }

  const handleMarkAsPaid = async (balance: (typeof balances)[number]) => {
    if (!tripDetails?.id || !currentToken || !settlementsAvailable) return

    try {
      const response = await fetch(
        apiUrl(`/api/trips/${tripDetails.id}/expenses/settlements`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            paid_by: balance.fromId,
            paid_to: balance.toId,
            amount: balance.amount,
          }),
        },
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to create settlement')
      setSettlements((current) => [result, ...current])
      toast.success('Paiement marque comme effectue')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de confirmer le paiement')
    }
  }

  const handleCategoryChange = (value: string) => {
    const selectedActivity = activityRows.find(
      (activity) => `Activity: ${activity.title}` === value,
    )

    setFormData((current) => ({
      ...current,
      category: value,
      amount: selectedActivity ? String(selectedActivity.total) : '',
    }))
  }

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null)
    setFormData({
      title: '',
      amount: '',
      paidBy: '',
      category: 'Activity',
      date: new Date().toISOString().split('T')[0],
    })
  }

  const startExpenseEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id)
    setFormData({
      title: expense.title,
      amount: String(expense.amount),
      paidBy: expense.paidById || SHARED_PAYMENT_VALUE,
      category: expense.category,
      date: expense.date,
    })
  }

  const handleSaveExpense = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(formData.amount)
    if (!formData.title.trim()) {
      toast.error('Ajoutez un titre pour la depense')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Entrez un montant superieur a 0')
      return
    }
    if (!selectedPaidBy) {
      toast.error('Selectionnez le membre qui a paye')
      return
    }
    if (!tripDetails?.id || !currentToken) {
      toast.error('La session ou le voyage n’est pas encore charge')
      return
    }

    setSavingExpense(true)
    try {
      const endpoint = editingExpenseId
        ? `/api/trips/${tripDetails.id}/expenses/${editingExpenseId}`
        : `/api/trips/${tripDetails.id}/expenses`
      const response = await fetch(apiUrl(endpoint), {
        method: editingExpenseId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          label: formData.title,
          amount,
          paid_by: selectedPaidBy === SHARED_PAYMENT_VALUE ? null : selectedPaidBy,
          shared_payment: selectedPaidBy === SHARED_PAYMENT_VALUE,
          category: formData.category,
          date: formData.date,
          split_between: members.map((member) => member.id),
        }),
      })
      const expense = await response.json()
      if (!response.ok) throw new Error(expense.error || 'Failed to create expense')

      const normalizedExpense: Expense = {
        id: expense.id,
        title: expense.label || expense.title,
        amount: toNumber(expense.amount),
        paidById: expense.paid_by || expense.paidBy || null,
        paidByName: expense.paid_by || expense.paidBy
          ? memberNameById[expense.paid_by || expense.paidBy] || 'Member'
          : 'Tous les membres',
        category: expense.category || formData.category,
        date: expense.date,
        splitBetween: Array.isArray(expense.split_between) ? expense.split_between : [],
      }

      setExpenses((current) =>
        editingExpenseId
          ? current.map((item) =>
              item.id === editingExpenseId ? normalizedExpense : item,
            )
          : [normalizedExpense, ...current],
      )
      const wasEditing = Boolean(editingExpenseId)
      cancelExpenseEdit()
      toast.success(wasEditing ? 'Depense modifiee' : 'Depense ajoutee')
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error(error instanceof Error ? error.message : 'Impossible d’ajouter la depense')
    } finally {
      setSavingExpense(false)
    }
  }

  const statCards = [
    {
      label: t("totalTripBudget"),
      value: formatMoney(budgetTotal),
      icon: WalletCards,
      className: 'bg-primary/10 text-primary',
    },
    {
      label: t("spentAmount"),
      value: formatMoney(spentTotal),
      icon: CreditCard,
      className: 'bg-accent/20 text-[#9f411d]',
    },
    {
      label: t("remainingBudget"),
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
              {t("travelBudget")}
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              {t("budgetExpenses")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t("budgetExpensesText")}
            </p>
          </div>
          <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
            <span className="text-muted-foreground">{t("trip")}</span>
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
              <h2 className="font-semibold text-foreground">{t("usedBudget")}</h2>
              <p className="text-sm text-muted-foreground">{formatMoney(spentTotal)} {t("spentOn")} {formatMoney(budgetTotal)}</p>
            </div>
            <span className="rounded-full bg-sidebar px-3 py-1 text-sm font-bold text-primary">{progressValue}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-700"
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="trip-budget">{t("totalBudgetDh")}</Label>
              <Input
                id="trip-budget"
                type="number"
                min="0"
                value={budgetInput ?? (budgetTotal || '')}
                onChange={(event) => setBudgetInput(event.target.value)}
                placeholder="5000"
                className="mt-2 bg-white"
                disabled={!canEditBudget}
              />
            </div>
            <Button
              type="button"
              onClick={handleSaveBudget}
              disabled={savingBudget || !canEditBudget}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Pencil className="size-4" />
              {savingBudget ? t("saving") : t("updateBudget")}
            </Button>
          </div>
          {!canEditBudget && (
            <p className="mt-2 text-xs text-muted-foreground">
              Seul l’admin du voyage peut modifier le budget total.
            </p>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t("estimatedActivitiesCost")}</h2>
                <p className="text-sm text-muted-foreground">{t("estimatedFormula")}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sidebar px-3 py-1 text-sm font-semibold text-primary">
                <CircleDollarSign className="size-4" />
                {formatMoney(estimatedTotal)}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <div className="hidden grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr] bg-sidebar/70 px-4 py-3 text-xs font-bold uppercase text-muted-foreground md:grid">
                <span>{t("activityName")}</span>
                <span>{t("pricePerPerson")}</span>
                <span>{t("participants")}</span>
                <span className="text-right">{t("total")}</span>
              </div>
              <div className="divide-y">
                {activityRows.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {t("noActivitiesBudget")}
                  </div>
                ) : activityRows.map((activity) => {
                  const ActivityIcon =
                    ACTIVITY_TYPES.find((type) => type.value === activity.type)?.icon ||
                    CircleDollarSign

                  return (
                    <div
                      key={activity.id}
                      className="grid gap-3 px-4 py-4 transition hover:bg-sidebar/30 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ActivityIcon className="size-5" />
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
                        {activity.participantCount} {t("participants")}
                      </span>
                      <span className="text-left text-lg font-bold text-foreground md:text-right">
                        {formatMoney(activity.total)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-foreground">{t("memberBalances")}</h2>
            <p className="mb-5 text-sm text-muted-foreground">{t("balancesText")}</p>
            {!settlementsAvailable && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Creez la table expense_settlements dans Supabase pour activer les reglements.
              </div>
            )}
            <div className="space-y-3">
              {balances.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-sidebar/30 p-5 text-center text-sm text-muted-foreground">
                  {t("noBalances")}
                </div>
              ) : balances.map((balance) => (
                <div key={`${balance.fromId}-${balance.toId}`} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <ArrowUpRight className="mt-1 size-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {balance.from} {t("owes")} {formatMoney(balance.amount)} {t("to")} {balance.to}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("autoSplit")}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleMarkAsPaid(balance)}
                    disabled={!settlementsAvailable}
                    className="mt-3 w-full bg-primary text-white hover:bg-primary/90"
                  >
                    <CheckCircle2 className="size-4" />
                    {t("markAsPaid")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleSaveExpense} className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Plus className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingExpenseId ? t("updateExpense") : t("realExpenses")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {editingExpenseId ? t("editSelectedExpense") : t("addRealExpense")}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="expense-title">{t("title")}</Label>
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
                  <Label htmlFor="expense-amount">{t("amount")}</Label>
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
                  <Label>{t("paidBy")}</Label>
                  <Select value={selectedPaidBy} onValueChange={(value) => setFormData((current) => ({ ...current, paidBy: value || current.paidBy }))}>
                    <SelectTrigger className="mt-2 w-full bg-white">
                      <SelectValue>
                        {selectedPaidByName}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SHARED_PAYMENT_VALUE}>
                        <span className="flex items-center gap-2">
                          <Users className="size-4 text-secondary" />
                          <span>{t("allPaidTheirShare")}</span>
                        </span>
                      </SelectItem>
                      <div className="my-1 border-t" />
                      {members.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {t("noMemberAvailable")}
                        </div>
                      ) : members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{member.name}</span>
                            <span className="rounded-full bg-sidebar px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              {member.role === 'owner' ? 'Admin' : t("member")}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("category")}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => value && handleCategoryChange(value)}
                  >
                    <SelectTrigger className="mt-2 w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                        {t("activitiesCreated")}
                      </div>
                      {activityRows.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {t("noActivityCreated")}
                        </div>
                      ) : activityRows.map((activity) => (
                        <SelectItem key={activity.id} value={`Activity: ${activity.title}`}>
                          {activity.title}
                        </SelectItem>
                      ))}
                      <div className="mt-1 border-t px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                        {t("choices")}
                      </div>
                      {customCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={savingExpense}
                  className="flex-1 bg-primary text-white hover:bg-primary/90"
                >
                  <ReceiptText className="size-4" />
                  {savingExpense
                    ? t("saving")
                    : editingExpenseId
                      ? t("updateExpenseButton")
                      : t("addExpense")}
                </Button>
                {editingExpenseId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelExpenseEdit}
                  >
                    {t("cancel")}
                  </Button>
                )}
              </div>
            </div>
          </form>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t("expensesList")}</h2>
                <p className="text-sm text-muted-foreground">{t("paymentsHistory")}</p>
              </div>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                {expenses.length} {t("entries")}
              </span>
            </div>

            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-sidebar/30 p-6 text-center text-sm text-muted-foreground">
                  {t("noRealExpenses")}
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
                        {expense.date} - {expense.category} - {t("paidByLower")} {expense.paidByName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <p className="text-lg font-bold text-foreground">{formatMoney(expense.amount)}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startExpenseEdit(expense)}
                      title="Modifier la depense"
                      className="text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExpense(expense.id)}
                      title="Supprimer la depense"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
