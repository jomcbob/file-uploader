import { Router } from "express";
import indexController from "../controllers/indexController.js";
import multer from "multer";
const indexRoute = Router();

indexRoute.get("/", indexController.renderIndex);
const upload = multer({ dest: './public/data/uploads/' })
indexRoute.post("/submit-image", upload.single('fileName'), indexController.uploadImage);

indexRoute.post("/submit-folder", indexController.submitfolder);

export { indexRoute };