import express from "express";
import { getPlanningByMonth, setPlanningEntry } from "../domain/planning.service.js";

const router = express.Router();

// GET /api/planning?month=YYYY-MM
router.get("/", async (req, res) => {
  const month = typeof req.query.month === "string" ? req.query.month : null;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({
      error: "invalid_month",
      message: "month must be in format YYYY-MM",
    });
  }

  const data = await getPlanningByMonth(month);
  res.json(data);
});

// POST /api/planning
router.post("/", async (req, res) => {
  const date = typeof req.body?.date === "string" ? req.body.date : "";
  const serviceCode = typeof req.body?.serviceCode === "string" ? req.body.serviceCode : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "invalid_date", message: "date must be YYYY-MM-DD" });
  }

  if (!serviceCode || serviceCode.length > 32) {
    return res.status(400).json({ error: "invalid_serviceCode", message: "serviceCode required" });
  }

  const result = await setPlanningEntry({ date, serviceCode });
  res.json(result);
});

export default router;
