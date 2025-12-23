import { Router } from "express";
import shareController from "../controllers/shareController.js";

const shareRoute = Router();

// Create share link
shareRoute.post("/generate-link/:id", shareController.createShare);

// Shared page (HTML page) — users copy/share this
shareRoute.get("/token/:token", shareController.renderSharedEntity);

// File preview (used in <img>) → presigned S3
shareRoute.get("/entity/:token", shareController.accessSharedEntity);

// Download file → presigned S3 with attachment
shareRoute.get("/download/:token", shareController.downloadShared);

// Duration picker (generic) — last, to avoid conflicts
shareRoute.get("/:id", shareController.pickDuration);

export { shareRoute };
