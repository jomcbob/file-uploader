import { Router } from "express";
import indexController from "../controllers/indexController.js";
import multer from "multer";
const indexRoute = Router();

indexRoute.get("/", indexController.renderIndex);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

indexRoute.get("/file/:id", indexController.previewFile);

indexRoute.get("/download/:id", indexController.downloadFile);



indexRoute.post("/submit-folder", indexController.validateFolder, indexController.submitfolder);

indexRoute.post("/submit-image", upload.single('fileName'), indexController.uploadImage);

indexRoute.post("/delete", indexController.deleteEntity);

export { indexRoute };