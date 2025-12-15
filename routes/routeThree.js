const { Router } = require("express");
const routeThreeController = require("../controllers/controllerThree");
const routeThree = Router();

routeThree.get("/", routeThreeController.renderIndex);

module.exports = { routeThree }