import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import webhookRouter from "./webhook.js";
import adminApiRouter from "./adminApi.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "terms.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});

app.use("/api", adminApiRouter);
app.use("/", webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
