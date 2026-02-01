/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getAllServices, addService } from "./storage.js";
import { SERVICES_CATALOG } from "./services-catalog.js";

export async function initServicesIfNeeded() {
  const existing = await getAllServices();
  if (existing.length > 0) return;

  for (const service of SERVICES_CATALOG) {
    await addService(service);
  }
}

