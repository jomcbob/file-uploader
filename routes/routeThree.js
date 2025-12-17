import { Router } from "express";
import routeThreeController from "../controllers/controllerThree.js";
const routeThree = Router();

routeThree.get("/", routeThreeController.renderIndex);

export { routeThree };