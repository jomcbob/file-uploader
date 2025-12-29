import { getPresignedUrl } from "../lib/s3.js";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

function pickDuration(req, res) {
  res.render("durationForm", { id: req.params.id });
}

async function checkSharedEntityToken(req, res, next) {
  const { token } = req.params;

  const shared = await prisma.sharedEntity.findFirst({
    where: { shareToken: token, shareExpires: { gt: new Date() } },
    include: { entity: true }
  });
  if (!shared) return res.status(404).send("Link expired or invalid")

  req.shared = shared
  next()
}

async function createShareLink(req, res) {
  const { id } = req.params;
  const duration = parseInt(req.body.duration, 10)

  const entity = await prisma.entity.findUnique({
    where: { id: Number(id) },
  })

  if (!entity) return res.status(404).send("Not found")
  if (entity.userId !== req.user.id) return res.status(403).send("Forbidden")

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + duration * 1000)

  await prisma.sharedEntity.create({
    data: {
      userId: req.user.id,
      entityId: entity.id,
      shareToken: token,
      shareExpires: expiresAt,
    },
  })

  res.redirect(`/share/token/${token}`)
}

async function renderSharedEntity(req, res) {
  const root = req.shared.entity

  const allEntities = await prisma.entity.findMany({
    where: { userId: root.userId },
  })

  const files = collectAllFiles(root.id, allEntities)

  res.render("entity", {
    token: req.params.token,
    entity: root,
    allFiles: files,
    APP_URL: process.env.APP_URL,
  })
}

function collectAllFiles(rootId = null, allEntities) {
  const files = []
  const childrenMap = new Map()

  // Build map: parentId → [childEntities]
  allEntities.forEach(e => {
    if (!childrenMap.has(e.parentId)) childrenMap.set(e.parentId, [])
    childrenMap.get(e.parentId).push(e)
  })

  function recurse(parentId) {
    const children = childrenMap.get(parentId) || []
    for (const child of children) {
      if (child.type === "FILE") files.push(child)
      else if (child.type === "FOLDER") recurse(child.id)
    }
  }

  recurse(rootId); // rootId is null for top-level
  return files
}

async function fetchFromBucket(inline, token, folderId, res) {

  const shared = await prisma.sharedEntity.findFirst({
    where: { shareToken: token },
    include: { entity: true },
  });

  if (!shared) {
    return res.status(404).send("Link invalid")
  }

  if (shared.shareExpires <= new Date()) {
    await prisma.sharedEntity.delete({
      where: { id: '780c5a0d-652f-4998-af61-9f5e8ba3ed55' },
    });
    return res.status(404).send("Link expired")
  }


  let allFiles
  let fileEntity
  if (folderId) {
    console.log("folderEntity")
    // then find all files / folders of the user that shared the entity
    const allEntities = await prisma.entity.findMany({
      where: { userId: shared.entity.userId },
    })
    fileEntity = allEntities.find(e => e.id === Number(folderId))
    if (!fileEntity) return res.status(404).send("folder not found")

    allFiles = collectAllFiles(fileEntity.id, allEntities)
  } else {
    console.log("fileEntity")
    fileEntity = shared.entity
    if (!fileEntity || fileEntity.type !== "FILE") return res.status(404).send("File not found")
  }

  const key = fileEntity.url.split(`${process.env.RAILWAY_BUCKET_NAME}/`)[1]
  console.log(key + " " + 'key')
  const url = await getPresignedUrl(key, {
    inline: inline,
    filename: fileEntity.name,
    mimeType: fileEntity.mimeType,
    expiresIn: 60 * 60 * 24, // 1 day
  });

  res.redirect(302, url);
}


async function accessSharedFile(req, res) {
  await fetchFromBucket(true, req.params.token, req.query.folderId, res)
}


export async function downloadShared(req, res) {
  await fetchFromBucket(false, req.params.token, req.query.folderId, res)
}


export default {
  pickDuration,
  createShareLink,
  renderSharedEntity,
  downloadShared,
  checkSharedEntityToken,
  accessSharedFile,
};