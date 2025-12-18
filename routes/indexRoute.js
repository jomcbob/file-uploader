import { Router } from "express";
import indexController from "../controllers/indexController.js";
import multer from "multer";
const indexRoute = Router();

indexRoute.get("/", indexController.renderIndex);

const upload = multer({
  storage: multer.memoryStorage(),
});

indexRoute.post("/submit-image", upload.single('fileName'), indexController.uploadImage);
indexRoute.post("/delete", indexController.deleteEntity);
indexRoute.get("/file/:id", indexController.previewFile);
indexRoute.get("/download/:id", indexController.downloadFile);


indexRoute.post("/submit-folder", indexController.submitfolder);

export { indexRoute };