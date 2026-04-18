import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { investigationRouter } from "./routes/investigation.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/investigation", investigationRouter);

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  response.status(500).json({
    message: error instanceof Error ? error.message : "Unexpected server error",
  });
});
