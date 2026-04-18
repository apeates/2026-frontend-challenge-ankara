import { Router } from "express";
import {
  getInvestigationHandler,
  getPeopleHandler,
  getPersonHandler,
} from "../controllers/investigation.controller.js";

export const investigationRouter = Router();

investigationRouter.get("/", getInvestigationHandler);
investigationRouter.get("/people", getPeopleHandler);
investigationRouter.get("/person/:id", getPersonHandler);
