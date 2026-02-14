export async function fetchPlanningByMonth(month) {
  // mock: retourne 2 jours quel que soit le mois, juste pour tester le contrat
  return [
    { date: `${month}-10`, serviceCode: "2200" },
    { date: `${month}-11`, serviceCode: "2201" },
  ];
}

export async function savePlanningEntry(entry) {
  // mock: on ne persiste rien, on simule juste le succès
  return { ok: true };
}
