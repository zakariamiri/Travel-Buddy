import { NextRequest, NextResponse } from "next/server";

const AI_API_URL = process.env.TRAVEL_BUDDY_AI_URL || "http://localhost:8000/chat";

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(message: string, words: string[]) {
  return words.some((word) => message.includes(word));
}

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
  const message = normalizeText(payload.message || "");
  const destination = payload.destination || "la destination";
  const wantsRestaurants = hasAny(message, ["restaurant", "resto", "restau", "manger", "diner", "dejeuner", "food"]);
  const wantsHotels = hasAny(message, ["hotel", "riad", "airbnb", "hostel", "logement", "hebergement", "dormir"]);
  const wantsTransport = hasAny(message, ["transport", "bus", "train", "metro", "taxi", "voiture", "aeroport", "deplacement"]);
  const wantsPlan = hasAny(message, ["planning", "itineraire", "programme", "jour", "plan"]);
  const wantsBudget = hasAny(message, ["budget", "prix", "depense", "cout", "economique", "cher", "argent"]);
  const wantsBeach = hasAny(message, ["plage", "beach", "mer", "swim", "baignade"]);
  const wantsCulture = hasAny(message, ["culture", "musee", "museum", "histor", "monument", "local"]);
  const wantsShopping = hasAny(message, ["shopping", "marche", "souvenir", "mall", "boutique"]);
  const wantsNightlife = hasAny(message, ["soir", "nuit", "night", "club", "bar", "fete"]);
  const wantsSafety = hasAny(message, ["securite", "danger", "eviter", "safe", "conseil"]);

  let recommendations: string;
  let avoid = "Evite de reserver trop vite sans comparer les distances, les avis et le budget disponible.";
  let tips = "Donne-moi ton style de voyage et je peux affiner la selection.";

  if (wantsRestaurants) {
    recommendations =
      `Restaurants recommandes :\n` +
      `- Restaurant local traditionnel (${destination}) : cuisine locale et bon rapport qualite/prix.\n` +
      `- Cafe central (${destination}) : pratique pour petit-dejeuner ou pause.\n` +
      `- Restaurant avec vue (${destination}) : option plus premium pour une soiree speciale.\n` +
      `- Street food ou marche local (${destination}) : economique, rapide et vivant.`;
    avoid = "Evite les restaurants tres touristiques sans prix affiches et les menus trop chers pour tout le groupe.";
    tips = "Reserve un seul bon restaurant, puis garde les autres repas flexibles.";
  } else if (wantsHotels) {
    recommendations =
      `Hebergements conseilles :\n` +
      `- Centre de ${destination} : pratique si vous voulez marcher et reduire le transport.\n` +
      `- Appartement/Airbnb : bon choix pour un groupe avec cuisine et budget controle.\n` +
      `- Hotel 3-4 etoiles : confort moyen avec petit-dejeuner inclus.\n` +
      `- Hostel/chambre partagee : option economique si le budget est limite.`;
    avoid = "Evite les logements loin du centre si le transport coute plus cher que l'economie.";
    tips = "Compare toujours prix total + transport + annulation gratuite.";
  } else if (wantsTransport) {
    recommendations =
      `Transport recommande :\n` +
      `- Marche + transport public pour les trajets courts dans ${destination}.\n` +
      `- Taxi/VTC seulement le soir ou pour les zones mal desservies.\n` +
      `- Carte transport/journee si vous faites plusieurs deplacements.\n` +
      `- Regroupe les activites par quartier pour economiser temps et budget.`;
    avoid = "Evite de traverser la ville plusieurs fois dans la meme journee.";
    tips = "Je peux organiser les activites par zones pour minimiser le transport.";
  } else if (wantsPlan) {
    recommendations =
      `Planning propose :\n` +
      `- Jour 1 : arrivee, installation, balade legere dans le centre de ${destination}.\n` +
      `- Jour 2 : monuments, musee ou quartier historique.\n` +
      `- Jour 3 : activite nature/plage ou excursion proche.\n` +
      `- Jour 4 : shopping, marche local, restaurant selectionne.\n` +
      `- Dernier jour : activites courtes et marge pour le retour.`;
    avoid = "Evite les grosses excursions le jour d'arrivee ou le dernier jour.";
    tips = "Demande-moi un planning precis selon la duree exacte du voyage.";
  } else if (wantsBudget) {
    const budgetAdvice =
      level === "economique"
        ? "Priorise activites gratuites, marches locaux, transport public et repas simples."
        : level === "moyen"
          ? "Melange activites gratuites et payantes, avec 15% du budget garde pour les imprevus."
          : "Tu peux ajouter excursions premium et restaurants avec vue, tout en gardant un plafond par jour.";
    recommendations = `Conseil budget :\n- ${budgetAdvice}\n- Budget/personne/jour estime : ${Math.round(perDay)} ${payload.currency}.\n- Prevois une reserve pour transport, snacks et imprevus.`;
    avoid = "Evite les reservations non remboursables avant validation du groupe.";
    tips = "Je peux te faire une repartition repas / transport / activites.";
  } else if (wantsBeach) {
    recommendations =
      `Plages et nature :\n` +
      `- Cherche une plage proche du logement pour eviter trop de transport.\n` +
      `- Prevois une plage connue pour le coucher de soleil.\n` +
      `- Ajoute une activite nautique seulement si le budget le permet.\n` +
      `- Garde une demi-journee libre pour repos et photos.`;
    avoid = "Evite les plages privees trop cheres si le groupe veut rester economique.";
    tips = "Le meilleur format est souvent plage le matin, centre-ville en fin de journee.";
  } else if (wantsCulture) {
    recommendations =
      `Culture et visites :\n` +
      `- Centre historique de ${destination} : balade, photos et architecture.\n` +
      `- Musee ou monument principal : bon choix par temps chaud ou pluie.\n` +
      `- Visite guidee courte : utile pour comprendre l'histoire locale.\n` +
      `- Marche traditionnel : culture, cuisine et souvenirs.`;
    avoid = "Evite d'enchainer trop de musees le meme jour.";
    tips = "Combine culture le matin et activite relax l'apres-midi.";
  } else if (wantsShopping) {
    recommendations =
      `Shopping et souvenirs :\n` +
      `- Marche local de ${destination} pour souvenirs et produits artisanaux.\n` +
      `- Boutiques du centre pour cadeaux rapides.\n` +
      `- Mall seulement si vous cherchez confort, climatisation et marques.\n` +
      `- Fixe un petit budget souvenirs par personne.`;
    avoid = "Evite d'acheter au premier stand sans comparer les prix.";
    tips = "Garde le shopping vers la fin du voyage pour ne pas transporter trop d'achats.";
  } else if (wantsNightlife) {
    recommendations =
      `Soirees :\n` +
      `- Bar calme en debut de soiree pour le groupe.\n` +
      `- Rooftop ou lieu avec vue si le budget est moyen/premium.\n` +
      `- Quartier anime de ${destination}, mais proche du logement.\n` +
      `- Prevois le transport retour avant de sortir.`;
    avoid = "Evite les lieux sans avis fiables ou trop loin du logement.";
    tips = "Fixe une heure de retour et un budget boisson par personne.";
  } else if (wantsSafety) {
    recommendations =
      `Conseils securite :\n` +
      `- Gardez copies des documents et partagez l'adresse du logement.\n` +
      `- Utilisez transport officiel la nuit.\n` +
      `- Evitez de porter trop de cash.\n` +
      `- Gardez un point de rendez-vous si le groupe se separe.`;
    avoid = "Evite les zones isolees la nuit et les offres trop belles pour etre vraies.";
    tips = "Je peux aussi faire une checklist depart pour le groupe.";
  } else {
    recommendations =
      `Activites recommandees :\n` +
      `- Centre historique de ${destination} : balade, photos et culture locale.\n` +
      `- Marche local de ${destination} : cuisine, souvenirs et ambiance.\n` +
      `- Point de vue principal de ${destination} : coucher de soleil et photos.\n` +
      `- Musee ou site culturel de ${destination} : bonne activite de journee.\n` +
      `- Excursion autour de ${destination} : option premium selon le budget.`;
  }

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
      `A eviter : ${avoid}\n\n` +
      `Conseils : ${tips}`,
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
