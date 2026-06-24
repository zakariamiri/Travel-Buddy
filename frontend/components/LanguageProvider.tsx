"use client";

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type Language = "en" | "fr";
type Dictionary = Record<string, { en: string; fr: string }>;

const dictionary: Dictionary = {
  dashboard: { en: "Dashboard", fr: "Tableau de bord" },
  trips: { en: "Trips", fr: "Voyages" },
  explore: { en: "Explore", fr: "Explorer" },
  expenses: { en: "Expenses", fr: "Dépenses" },
  settings: { en: "Settings", fr: "Paramètres" },
  logout: { en: "Logout", fr: "Déconnexion" },
  searchDestinations: { en: "Search destinations...", fr: "Rechercher des destinations..." },
  notifications: { en: "Notifications", fr: "Notifications" },
  noInvitations: { en: "No invitations yet.", fr: "Aucune invitation pour le moment." },
  tripInvitation: { en: "You have a trip invitation", fr: "Vous avez une invitation de voyage" },
  invitationAccepted: { en: "Invitation accepted", fr: "Invitation acceptée" },
  newActivityVote: { en: "New activity to vote", fr: "Nouvelle activité à voter" },
  memberAccepted: { en: "A member accepted", fr: "Un membre a accepté" },
  checkEmailJoin: { en: "Check your email or click to join.", fr: "Vérifiez votre email ou cliquez pour rejoindre." },
  openTripDashboard: { en: "Open trip dashboard.", fr: "Ouvrir le tableau du voyage." },
  travelBuddyDashboard: { en: "Travel Buddy Dashboard", fr: "Tableau de bord Travel Buddy" },
  welcome: { en: "Welcome", fr: "Bienvenue" },
  dashboardSubtitle: {
    en: "Where next? Your collaborative itineraries are ready for the next adventure.",
    fr: "Prochaine destination ? Vos itinéraires collaboratifs sont prêts pour la prochaine aventure.",
  },
  createTrip: { en: "Create Trip", fr: "Créer un voyage" },
  createNewTrip: { en: "Create New Trip", fr: "Créer un nouveau voyage" },
  tripTitle: { en: "Trip Title", fr: "Titre du voyage" },
  destination: { en: "Destination", fr: "Destination" },
  coverImage: { en: "Cover Image", fr: "Image de couverture" },
  startDate: { en: "Start Date", fr: "Date de début" },
  endDate: { en: "End Date", fr: "Date de fin" },
  totalBudgetDh: { en: "Total budget (DH)", fr: "Budget total (DH)" },
  budgetHint: {
    en: "This amount will be used to calculate the remaining budget.",
    fr: "Ce montant sera utilisé pour calculer le budget restant.",
  },
  creating: { en: "Creating...", fr: "Création..." },
  pendingInvitation: { en: "pending", fr: "en attente" },
  checkEmailInvitation: { en: "Check your email to accept the invitation.", fr: "Vérifiez votre email pour accepter l’invitation." },
  join: { en: "Join", fr: "Rejoindre" },
  assistantBadge: { en: "Travel-Buddy AI Assistant", fr: "Assistant IA Travel-Buddy" },
  assistantCtaTitle: { en: "Need ideas based on your budget?", fr: "Besoin d’idées selon votre budget ?" },
  assistantCtaText: {
    en: "The chatbot uses the destination, total budget, members and dates to suggest adapted activities.",
    fr: "Le chatbot utilise la destination, le budget total, les membres et les dates pour proposer des activités adaptées.",
  },
  openChatbot: { en: "Open chatbot", fr: "Ouvrir le chatbot" },
  activeTrip: { en: "Active trip", fr: "Voyage actif" },
  collaborators: { en: "collaborators", fr: "collaborateurs" },
  days: { en: "days", fr: "jours" },
  openItinerary: { en: "Open itinerary", fr: "Ouvrir l’itinéraire" },
  noUpcomingTrip: { en: "No upcoming trip", fr: "Aucun voyage à venir" },
  createNewTripStart: { en: "Create a new trip to get started", fr: "Créez un nouveau voyage pour commencer" },
  tripExpenses: { en: "Trip Expenses", fr: "Dépenses du voyage" },
  openBudget: { en: "Open Budget", fr: "Ouvrir le budget" },
  untilNextTrip: { en: "until your next trip", fr: "avant votre prochain voyage" },
  myTrips: { en: "My Trips", fr: "Mes voyages" },
  tripsSubtitle: { en: "All your plans in one quiet place.", fr: "Tous vos plans au même endroit." },
  all: { en: "All", fr: "Tous" },
  upcoming: { en: "Upcoming", fr: "À venir" },
  past: { en: "Past", fr: "Passés" },
  loadingTrips: { en: "Loading trips...", fr: "Chargement des voyages..." },
  noTripsYet: { en: "No trips yet", fr: "Aucun voyage pour le moment" },
  createFirstTrip: { en: "Create your first trip to start planning.", fr: "Créez votre premier voyage pour commencer." },
  tripsCalendar: { en: "Trips Calendar", fr: "Calendrier des voyages" },
  planTimeline: { en: "Plan your trips timeline", fr: "Planifiez le calendrier de vos voyages" },
  planTimelineText: {
    en: "Visualize all your trips by date, quickly open a trip, and keep a clear view of upcoming departures.",
    fr: "Visualisez tous vos voyages par date, ouvrez rapidement un voyage et gardez une vue claire des prochains départs.",
  },
  active: { en: "Active", fr: "Actifs" },
  members: { en: "Members", fr: "Membres" },
  loadingCalendar: { en: "Loading calendar...", fr: "Chargement du calendrier..." },
  upcomingTrips: { en: "Upcoming trips", fr: "Voyages à venir" },
  quickAccessSchedule: { en: "Quick access by schedule", fr: "Accès rapide par calendrier" },
  noScheduledTrips: { en: "No dated trip yet.", fr: "Aucun voyage daté pour le moment." },
  confirmed: { en: "Confirmed", fr: "Confirmé" },
  planning: { en: "Planning", fr: "Planifié" },
  ongoing: { en: "Ongoing", fr: "En cours" },
  scheduledTrips: { en: "scheduled trips", fr: "voyages planifiés" },
  today: { en: "Today", fr: "Aujourd’hui" },
  timeline: { en: "Timeline", fr: "Planning" },
  votes: { en: "Votes", fr: "Votes" },
  budget: { en: "Budget", fr: "Budget" },
  assistant: { en: "Assistant", fr: "Assistant" },
  navigation: { en: "Navigation", fr: "Navigation" },
  sendInvitation: { en: "Send invitation", fr: "Envoyer invitation" },
  sending: { en: "Sending...", fr: "Envoi..." },
  assistantPageTitle: { en: "Travel-Buddy Assistant", fr: "Assistant Travel-Buddy" },
  assistantPageText: {
    en: "Ask for recommendations adapted to the total budget, members and trip duration.",
    fr: "Demandez des recommandations adaptées au budget total, aux membres et à la durée du voyage.",
  },
  duration: { en: "Duration", fr: "Durée" },
  level: { en: "Level", fr: "Niveau" },
  tripContext: { en: "Trip context", fr: "Contexte du voyage" },
  budgetPerPersonDay: { en: "Budget/person/day", fr: "Budget/personne/jour" },
  appliedRule: { en: "Applied rule", fr: "Règle appliquée" },
  discussion: { en: "Discussion", fr: "Discussion" },
  assistantUsesBudget: {
    en: "The assistant automatically uses the dashboard budget.",
    fr: "L’assistant utilise automatiquement le budget du dashboard.",
  },
  assistantThinking: { en: "Assistant is thinking...", fr: "Assistant en train de réfléchir..." },
  send: { en: "Send", fr: "Envoyer" },
  travelBudget: { en: "Travel Budget", fr: "Budget voyage" },
  budgetExpenses: { en: "Budget & Expenses", fr: "Budget et dépenses" },
  budgetExpensesText: {
    en: "Track the trip budget, activity estimates and real paid expenses.",
    fr: "Suivez le budget du voyage, les estimations par activité et les dépenses réellement payées.",
  },
  trip: { en: "Trip", fr: "Voyage" },
  totalTripBudget: { en: "Trip total budget", fr: "Budget total du voyage" },
  spentAmount: { en: "Spent amount", fr: "Montant dépensé" },
  remainingBudget: { en: "Remaining budget", fr: "Budget restant" },
  usedBudget: { en: "Used budget", fr: "Budget utilisé" },
  spentOn: { en: "spent on", fr: "dépensés sur" },
  updateBudget: { en: "Update budget", fr: "Modifier le budget" },
  saving: { en: "Saving...", fr: "Enregistrement..." },
  adminOnlyBudget: {
    en: "Only the trip admin can update the total budget.",
    fr: "Seul l’admin du voyage peut modifier le budget total.",
  },
  estimatedActivitiesCost: { en: "Estimated Activities Cost", fr: "Coût estimé des activités" },
  estimatedFormula: {
    en: "Total = price per person x participants or votes.",
    fr: "Total = prix par personne x participants ou votes.",
  },
  activityName: { en: "Activity name", fr: "Nom activité" },
  pricePerPerson: { en: "Price/person", fr: "Prix/personne" },
  participants: { en: "participants", fr: "participants" },
  total: { en: "Total", fr: "Total" },
  noActivitiesBudget: {
    en: "No activity available to estimate the budget.",
    fr: "Aucune activité disponible pour estimer le budget.",
  },
  memberBalances: { en: "Member Balances", fr: "Soldes des membres" },
  balancesText: { en: "Who should pay and who should receive money.", fr: "Qui doit payer et qui doit recevoir." },
  noBalances: { en: "No balance to settle yet.", fr: "Aucun solde à régler pour le moment." },
  owes: { en: "owes", fr: "doit payer" },
  to: { en: "to", fr: "à" },
  autoSplit: { en: "Automatic split of real expenses.", fr: "Split automatique des dépenses réelles." },
  markAsPaid: { en: "Mark as paid", fr: "Marquer comme payé" },
  realExpenses: { en: "Real Expenses", fr: "Dépenses réelles" },
  updateExpense: { en: "Update Expense", fr: "Modifier la dépense" },
  addRealExpense: { en: "Add a real expense.", fr: "Ajouter une dépense réelle." },
  editSelectedExpense: { en: "Edit selected expense.", fr: "Modifier la dépense sélectionnée." },
  title: { en: "Title", fr: "Titre" },
  amount: { en: "Amount", fr: "Montant" },
  paidBy: { en: "Paid by", fr: "Payé par" },
  category: { en: "Category", fr: "Catégorie" },
  allPaidTheirShare: { en: "Everyone paid their share", fr: "Tous ont payé leur part" },
  noMemberAvailable: { en: "No member available", fr: "Aucun membre disponible" },
  member: { en: "Member", fr: "Membre" },
  activitiesCreated: { en: "Activities created", fr: "Activités créées" },
  noActivityCreated: { en: "No activity created", fr: "Aucune activité créée" },
  choices: { en: "Choices", fr: "Choix" },
  addExpense: { en: "Add expense", fr: "Ajouter dépense" },
  updateExpenseButton: { en: "Update expense", fr: "Modifier dépense" },
  cancel: { en: "Cancel", fr: "Annuler" },
  expensesList: { en: "Expenses List", fr: "Liste des dépenses" },
  paymentsHistory: { en: "Real payments history.", fr: "Historique des paiements réels." },
  entries: { en: "entries", fr: "entrées" },
  noRealExpenses: { en: "No real expense added yet.", fr: "Aucune dépense réelle ajoutée pour le moment." },
  paidByLower: { en: "paid by", fr: "payé par" },
  itineraryTimeline: { en: "Itinerary Timeline", fr: "Planning du voyage" },
  timelineText: {
    en: "Organize approved activities by day and adjust the trip schedule.",
    fr: "Organisez les activités approuvées par jour et ajustez le planning du voyage.",
  },
  tripDuration: { en: "Trip duration", fr: "Durée du voyage" },
  filter: { en: "Filter", fr: "Filtrer" },
  tripDays: { en: "Trip days", fr: "Jours du voyage" },
  approvedActivities: { en: "Approved activities", fr: "Activités approuvées" },
  day: { en: "Day", fr: "Jour" },
  addActivity: { en: "Add Activity", fr: "Ajouter activité" },
  noTripDetails: {
    en: "No trip details available to calculate itinerary.",
    fr: "Aucun détail du voyage disponible pour calculer l’itinéraire.",
  },
  activityVoting: { en: "Activity Voting", fr: "Vote des activités" },
  voteOnActivities: { en: "Vote on Activities", fr: "Voter les activités" },
  voteText: {
    en: "Choose the activities you want to keep in the trip.",
    fr: "Choisissez les activités que vous voulez garder dans le voyage.",
  },
  tripMembers: { en: "Trip members", fr: "Membres du voyage" },
  pending: { en: "Pending", fr: "En attente" },
  approved: { en: "Approved", fr: "Approuvé" },
  rejected: { en: "Rejected", fr: "Rejeté" },
  totalActivities: { en: "Total activities", fr: "Total activités" },
  waitingVotes: { en: "Waiting votes", fr: "Votes en attente" },
  noActivitiesHere: { en: "No activities here", fr: "Aucune activité ici" },
  activitiesStatusHint: {
    en: "Activities will appear here when they match this status.",
    fr: "Les activités apparaîtront ici quand elles correspondent à ce statut.",
  },
  assistantPlaceholder: {
    en: "Ex: suggest budget-friendly activities for this trip...",
    fr: "Ex: propose-moi des activités économiques pour ce voyage...",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof dictionary) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_STORAGE_KEY = "travel-buddy-language";
const LANGUAGE_CHANGE_EVENT = "travel-buddy-language-change";

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "fr" || savedLanguage === "en" ? savedLanguage : "en";
}

function subscribeToLanguage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore<Language>(subscribeToLanguage, readStoredLanguage, () => "en");

  const setLanguage = (nextLanguage: Language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "fr" : "en"),
      t: (key) => dictionary[key]?.[language] || key,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
