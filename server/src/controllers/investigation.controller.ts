import { type Request, type Response } from "express";
import {
  getInvestigation,
  getInvestigationPeople,
  getInvestigationPerson,
} from "../services/investigation.service.js";

export const getInvestigationHandler = async (_request: Request, response: Response) => {
  try {
    const investigation = await getInvestigation();
    response.json(investigation);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "Failed to build investigation data",
    });
  }
};

export const getPeopleHandler = async (_request: Request, response: Response) => {
  try {
    const people = await getInvestigationPeople();
    response.json(people);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "Failed to build people data",
    });
  }
};

export const getPersonHandler = async (request: Request, response: Response) => {
  try {
    const rawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const person = await getInvestigationPerson(rawId ?? "");

    if (!person) {
      response.status(404).json({ message: "Person not found" });
      return;
    }

    response.json(person);
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "Failed to build person data",
    });
  }
};
