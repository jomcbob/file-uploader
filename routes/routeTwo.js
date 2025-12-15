const { Router } = require("express");
const routeTwoController = require("../controllers/controllerTwo");
const routeTwo = Router();

routeTwo.get("/", routeTwoController.renderIndex);

module.exports = { routeTwo }