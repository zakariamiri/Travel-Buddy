import { NextRequest, NextResponse } from "next/server";

const AI_API_URL = process.env.TRAVEL_BUDDY_AI_URL || "http://localhost:8000/chat";

function buildFallbackAnswer(payload: {
  message?: string;
  destination: string;
  totalBudget: number;
  currency: string;
  numberOfMembers: number;
  durationDays: number;
  includeContext?: boolean;
}) {
  const members = Math.max(1, payload.numberOfMembers);
  const days = Math.max(1, payload.durationDays);
  const perPerson = payload.totalBudget / members;
  const perDay = perPerson / days;
  const level =
    perDay < 300 ? "economique" : perDay <= 800 ? "moyen" : "premium";
  const message = (payload.message || "").toLowerCase();
  const wantsRestaurants = ["restaurant", "resto", "manger", "diner", "dejeuner"].some((word) =>
    message.includes(word),
  );
  const destination = payload.destination || "la destination";
  const recommendations = wantsRestaurants
    ? `Restaurants recommandes :\n` +
      `- Restaurant local traditionnel (${destination}) : plats locaux et bon rapport qualite/prix.\n` +
      `- Cafe central (${destination}) : pratique pour petit-dejeuner ou pause.\n` +
      `- Restaurant avec vue (${destination}) : option premium si le groupe veut une belle experience.\n` +
      `- Street food ou marche local (${destination}) : economique et rapide.`
    : `Activites recommandees :\n` +
      `- Centre historique de ${destination} : balade, photos et culture locale.\n` +
      `- Marche local de ${destination} : cuisine, souvenirs et ambiance.\n` +
      `- Point de vue principal de ${destination} : coucher de soleil et photos.\n` +
      `- Musee ou site culturel de ${destination} : bonne activite de journee.\n` +
      `- Excursion autour de ${destination} : option premium selon le budget.`;

  const contextualIntro = payload.includeContext === false
    ? ""
    : `Destination : ${payload.destination}\n\n` +
      `Analyse du budget : ${payload.totalBudget} ${payload.currency} pour ${members} membre(s) sur ${days} jour(s), soit environ ${Math.round(perDay)} ${payload.currency} par personne par jour. Niveau: ${level}.\n\n`;

  return {
    destination: payload.destination,
    budgetPerPerson: Math.round(perPerson * 100) / 100,
    budgetPerPersonPerDay: Math.round(perDay * 100) / 100,
    budgetLevel: level,
    answer:
      contextualIntro +
      `${recommendations}\n\n` +
      `A eviter : ne planifie pas d'activites cheres avant de confirmer le budget reel disponible.\n\n` +
      `Conseils : demande-moi un planning jour par jour ou une selection selon repas, plage, culture ou transport.`,
    modelLoaded: false,
  };
}

export async function POST(request: NextRequest) {
  const payload = await request.json();

  try {
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({
      ...buildFallbackAnswer(payload),
      offline: true,
    });
  }
}
