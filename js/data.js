// data.js — données statiques : défis et types de composants

const COMPONENT_TYPES = [
  "CPU", "Carte mère", "Mémoire RAM", "Carte graphique", "SSD",
  "Disque dur", "Alimentation", "Boîtier", "Ventirad",
  "Ventilateurs", "Carte Wi-Fi", "Lecteur optique", "Autre"
];

const CHALLENGES = [
  {
    id: "c250",
    title: "Meilleur PC à 250 €",
    budget: 250,
    difficulty: "easy",
    description: "Construis le meilleur PC bureautique possible avec un budget très serré.",
    constraints: ["Budget maximum : 250 €", "Minimum 5 composants"]
  },
  {
    id: "c500",
    title: "Meilleur PC à 500 €",
    budget: 500,
    difficulty: "easy",
    description: "Un bon compromis performance / prix pour un usage polyvalent.",
    constraints: ["Budget maximum : 500 €", "Doit inclure un CPU et une carte mère compatibles"]
  },
  {
    id: "c700",
    title: "Meilleur PC à 700 €",
    budget: 700,
    difficulty: "medium",
    description: "Un PC capable de jouer correctement en 1080p.",
    constraints: ["Budget maximum : 700 €", "Doit inclure une carte graphique ou un CPU avec iGPU"]
  },
  {
    id: "c1000",
    title: "Meilleur PC à 1000 €",
    budget: 1000,
    difficulty: "medium",
    description: "Un PC gaming/streaming performant.",
    constraints: ["Budget maximum : 1000 €", "Minimum 7 composants"]
  },
  {
    id: "silent",
    title: "PC silencieux",
    budget: 900,
    difficulty: "medium",
    description: "Le silence avant tout : privilégie les ventirads performants et peu bruyants.",
    constraints: ["Budget maximum : 900 €", "Doit inclure un ventirad"]
  },
  {
    id: "gaming",
    title: "PC gaming",
    budget: 1200,
    difficulty: "hard",
    description: "Construis une configuration gaming taillée pour la performance.",
    constraints: ["Budget maximum : 1200 €", "Carte graphique obligatoire"]
  },
  {
    id: "streaming",
    title: "PC streaming",
    budget: 1300,
    difficulty: "hard",
    description: "Un PC capable de jouer et streamer en simultané.",
    constraints: ["Budget maximum : 1300 €", "Minimum 8 composants", "Carte graphique obligatoire"]
  },
  {
    id: "office",
    title: "PC bureautique",
    budget: 400,
    difficulty: "easy",
    description: "Un PC simple et efficace pour la bureautique.",
    constraints: ["Budget maximum : 400 €"]
  },
  {
    id: "lowpower",
    title: "PC consommation minimale",
    budget: 600,
    difficulty: "medium",
    description: "Optimise ta config pour une consommation électrique minimale.",
    constraints: ["Budget maximum : 600 €", "Alimentation obligatoire"]
  },
  {
    id: "rgb",
    title: "PC RGB",
    budget: 800,
    difficulty: "medium",
    description: "Priorité au style : un maximum de RGB sans exploser le budget.",
    constraints: ["Budget maximum : 800 €", "Minimum 6 composants"]
  },
  {
    id: "retro",
    title: "PC rétro",
    budget: 300,
    difficulty: "hard",
    description: "Construis une config avec un esprit rétro, petit budget, pièces d'occasion acceptées.",
    constraints: ["Budget maximum : 300 €", "Au moins un composant d'occasion"]
  }
];
