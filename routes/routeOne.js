const { Router } = require("express");
const routeOneController = require("../controllers/controllerOne");
const routeOne = Router();

routeOne.get("/", routeOneController.renderIndex);

module.exports = { routeOne }