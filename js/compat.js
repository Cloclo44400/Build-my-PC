// compat.js — vérifications de compatibilité simples (basées sur les noms saisis)
// Simplifié volontairement : analyse du texte saisi par l'utilisateur, pas de base de données de composants.

const Compat = {
  check(components, budget) {
    const results = [];

    const hasType = (type) => components.some(c => c.type === type);
    const findByType = (type) => components.find(c => c.type === type);

    // CPU + Carte mère présents ?
    const cpu = findByType("CPU");
    const mb = findByType("Carte mère");
    if (cpu && mb) {
      results.push({ ok: true, text: "CPU et carte mère présents" });
    } else if (cpu || mb) {
      results.push({ ok: false, text: "CPU ou carte mère manquant" });
    }

    // RAM
    if (hasType("Mémoire RAM")) {
      results.push({ ok: true, text: "Mémoire RAM présente" });
    } else {
      results.push({ ok: false, text: "Aucune mémoire RAM ajoutée" });
    }

    // GPU ou iGPU (on considère que le CPU peut avoir un iGPU si mentionné)
    const gpu = findByType("Carte graphique");
    const cpuHasIgpu = cpu && /igpu|graphics|vega|iris/i.test(cpu.name + " " + (cpu.comments || ""));
    if (gpu) {
      results.push({ ok: true, text: "Carte graphique dédiée présente" });
    } else if (cpuHasIgpu) {
      results.push({ ok: true, text: "iGPU détecté sur le CPU" });
    } else {
      results.push({ ok: false, text: "Pas de carte graphique ni d'iGPU détecté" });
    }

    // Alimentation
    if (hasType("Alimentation")) {
      results.push({ ok: true, text: "Alimentation présente" });
    } else {
      results.push({ ok: false, text: "Aucune alimentation ajoutée" });
    }

    // Stockage
    if (hasType("SSD") || hasType("Disque dur")) {
      results.push({ ok: true, text: "Stockage présent" });
    } else {
      results.push({ ok: false, text: "Aucun stockage ajouté" });
    }

    // Boîtier
    if (hasType("Boîtier")) {
      results.push({ ok: true, text: "Boîtier présent" });
    } else {
      results.push({ ok: false, text: "Aucun boîtier ajouté" });
    }

    // Budget
    const total = components.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
    if (budget) {
      if (total <= budget) {
        results.push({ ok: true, text: `Dans le budget (${total.toFixed(2)} € / ${budget} €)` });
      } else {
        results.push({ ok: false, text: `Budget dépassé de ${(total - budget).toFixed(2)} €` });
      }
    }

    return results;
  },

  computeScore(components, challenge) {
    const total = components.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
    let score = 100;

    // Pénalité dépassement budget
    if (total > challenge.budget) {
      const overRatio = (total - challenge.budget) / challenge.budget;
      score -= Math.min(60, overRatio * 200);
    } else {
      // Bonus si proche du budget sans le dépasser (utilisation efficace)
      const usage = total / challenge.budget;
      score -= (1 - usage) * 20; // pénalité légère si trop loin du budget
    }

    // Compatibilité
    const compat = this.check(components, challenge.budget);
    const failedCount = compat.filter(r => !r.ok).length;
    score -= failedCount * 8;

    // Nombre de composants minimum (heuristique générique)
    if (components.length < 4) score -= 15;

    score = Math.max(0, Math.min(100, Math.round(score)));
    return { score, total, compat };
  }
};
