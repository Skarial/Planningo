/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getAllServices, addService } from "./storage.js";
import { SERVICES_CATALOG } from "./services-catalog.js";
import { normalizeServicePeriods } from "./period-key.js";

export async function initServicesIfNeeded() {
  const existing = await getAllServices();
  const existingCodes = new Set(
    existing
      .filter((service) => service && typeof service.code === "string")
      .map((service) => service.code.toUpperCase()),
  );

  for (const service of SERVICES_CATALOG) {
    if (!service || typeof service.code !== "string") continue;
    const code = service.code.toUpperCase();
    if (existingCodes.has(code)) continue;
    await addService(normalizeServicePeriods(service));
  }
}
