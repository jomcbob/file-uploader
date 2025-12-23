import { getPresignedUrl } from "../lib/s3.js";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

function pickDuration(req, res) {
  res.render("durationForm", { id: req.params.id });
}

function renderSharedEntity(req, res) {
  const { token } = req.params;

  res.render("entity", {
    token,
    APP_URL: process.env.APP_URL,
  });
}

export async function createShare(req, res) {
  const { id } = req.params;
  const duration = parseInt(req.body.duration, 10);

  const entity = await prisma.entity.findUnique({
    where: { id: Number(id) },
  });

  if (!entity) return res.status(404).send("Not found");
  if (entity.userId !== req.user.id) return res.status(403).send("Forbidden");

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + duration * 1000);

  await prisma.sharedEntity.create({
    data: {
      userId: req.user.id,
      entityId: entity.id,
      shareToken: token,
      shareExpires: expiresAt,
    },
  });

  res.redirect(`/share/token/${token}`);
}

export async function accessSharedEntity(req, res) {
  const { token } = req.params;

  const shared = await prisma.sharedEntity.findFirst({
    where: { shareToken: token, shareExpires: { gt: new Date() } },
    include: { entity: { include: { childEntities: true } } },
  });

  if (!shared) return res.status(404).send("Link expired or invalid");

  const entity = shared.entity;

  if (entity.type === "FILE") {
    const key = entity.url.split(`${process.env.RAILWAY_BUCKET_NAME}/`)[1];
    const url = await getPresignedUrl(key, {
      inline: true,
      filename: entity.name,
      mimeType: entity.mimeType,
      expiresIn: 300, // temporary
    });
    return res.redirect(302, url);
  }

  const files = [];
  function collectFiles(folder) {
    for (const child of folder.childEntities) {
      if (child.type === "FILE") files.push(child);
      else if (child.type === "FOLDER") collectFiles(child);
    }
  }
  collectFiles(entity);

  const fileLinks = await Promise.all(files.map(async (file) => {
    const key = file.url.split(`${process.env.RAILWAY_BUCKET_NAME}/`)[1];
    const url = await getPresignedUrl(key, {
      inline: true,
      filename: file.name,
      mimeType: file.mimeType,
      expiresIn: 300,
    });
    return { name: file.name, url };
  }));

  res.render("sharedFolder", { folderName: entity.name, files: fileLinks });
}

async function getSharedEntity(token) {
  const shared = await prisma.sharedEntity.findUnique({
    where: { shareToken: token },
    include: { entity: true },
  });

  if (!shared) return null;
  if (shared.shareExpires < new Date()) return null;
  if (shared.entity.type !== "FILE") return null;

  const key = shared.entity.url.split(
    `${process.env.RAILWAY_BUCKET_NAME}/`
  )[1];

  return { entity: shared.entity, key };
}


export async function downloadShared(req, res) {
  const result = await getSharedEntity(req.params.token);
  if (!result) return res.status(404).send("Not found");

  const url = await getPresignedUrl(result.key, {
    inline: false,
    filename: result.entity.name,
    expiresIn: 60 * 60,
  });

  res.redirect(302, url);
}


export default {
  pickDuration,
  accessSharedEntity,
  createShare,
  renderSharedEntity,
  getSharedEntity,
  downloadShared,
};