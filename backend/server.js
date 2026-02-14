import express from "express";
import cors from "cors";
import planningRoutes from "./routes/planning.routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/planning", planningRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
