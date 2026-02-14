import { fetchPlanningByMonth as fetchMock } from "./planning-source.mock.js";
import { savePlanningEntry as saveMock } from "./planning-source.mock.js";

function getMode() {
  return process.env.PLANNING_SOURCE || "mock";
}

export async function fetchPlanningByMonth(month) {
  const mode = getMode();

  if (mode === "mock") {
    return fetchMock(month);
  }

  // placeholder pour plus tard
  throw new Error(`Unsupported planning source mode: ${mode}`);
}

export async function savePlanningEntry(entry) {
  const mode = getMode();

  if (mode === "mock") {
    return saveMock(entry);
  }

  throw new Error(`Unsupported planning source mode: ${mode}`);
}
