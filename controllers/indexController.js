import { prisma } from "../lib/prisma.js";
import { s3 } from "../lib/s3.js";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getPresignedUrl } from "../lib/s3.js";


function buildTree(items, parentId) {
  return items
    .filter(i => i.parentId === parentId)
    .map(i => ({
      ...i,
      children: buildTree(items, i.id)
    }));
}

async function renderIndex(req, res) {
  let selectedFolderId = null;
  if (req.query.selectedFolder) {
    selectedFolderId = parseInt(req.query.selectedFolder, 10);
  }

  let selectedFileId = null;
  if (req.query.selectedFile) {
    selectedFileId = parseInt(req.query.selectedFile, 10);
  }

  let items
  try {
    items = await prisma.entity.findMany({
      where: { userId: req.user.id },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return res.status(500).send("Internal Server Error");
  }
  const tree = buildTree(items, null)

  // Find the deepest selected entity (folder or file) else null
  let deepestEntity = null;
  if (selectedFolderId && !selectedFileId) {
    deepestEntity = await prisma.entity.findFirst({
      where: { id: selectedFolderId },
      include: { childEntities: true }
    });
  }
  if (selectedFileId) {
    deepestEntity = await prisma.entity.findFirst({
      where: { id: selectedFileId },
      include: { childEntities: true }
    });
  }
  res.render("index", { tree, title: "Home", selectedFolderId, selectedFileId, entity: deepestEntity });
}

async function uploadImage(req, res) {
  const parentId = parseInt(req.body.parentId, 10) || null;

  if (!req.user) {
    return res.status(401).send("Not authenticated");
  }

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const key = `uploads/${req.user.id}/${Date.now()}-${req.file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.RAILWAY_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    })
  );

  const fileUrl = `${process.env.RAILWAY_BUCKET_ENDPOINT}/${process.env.RAILWAY_BUCKET_NAME}/${key}`;

  await prisma.entity.create({
    data: {
      name: req.file.originalname,
      type: "FILE",
      size: req.file.size,
      mimeType: req.file.mimetype,
      url: fileUrl, 
      parentId,
      userId: req.user.id,
    },
  });

  res.redirect("/");
}


async function submitfolder(req, res) {
  const parentId = parseInt(req.body.parentId, 10)
  if (!req.user) {
    return res.status(401).send('Not authenticated');
  }

  await prisma.entity.create({
    data: {
      name: req.body.folderName,
      type: 'FOLDER',
      size: 0,
      mimeType: null,
      parentId: parentId || null,
      userId: req.user.id,
    },
  });

  res.redirect('/');
}

async function deleteEntity(req, res) {
  const entityId = parseInt(req.body.entityId, 10);

  if (!req.user) {
    return res.status(401).send("Not authenticated");
  }

  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
  });

  if (!entity) {
    return res.status(404).send("Entity not found");
  }

  await prisma.entity.delete({
    where: { id: entityId },
  });

  if (entity.type === "FILE" && entity.url) {
    const key = entity.url
      .split(`${process.env.RAILWAY_BUCKET_NAME}/`)[1];

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.RAILWAY_BUCKET_NAME,
        Key: key,
      })
    );
  }

  res.redirect("/");
}

async function getEntity(id) {
  const entity = await prisma.entity.findUnique({ where: { id } });
  if (!entity || entity.type !== "FILE") return null;

  const key = entity.url.split(
    `${process.env.RAILWAY_BUCKET_NAME}/`
  )[1];

  return { entity, key };
}


async function previewFile(req, res) {
  const result = await getEntity(Number(req.params.id));
  if (!result) return res.status(404).send("File not found");

  if (result.entity.userId !== req.user.id) {
    return res.status(403).send("Forbidden");
  }

  const url = await getPresignedUrl(result.key, {
    inline: true,
    filename: result.entity.name,
    mimeType: result.entity.mimeType,
    expiresIn: 60 * 60,
  });

  res.redirect(302, url);
}


async function downloadFile(req, res) {
  const result = await getEntity(Number(req.params.id));
  if (!result) return res.status(404).send("Not found");

  if (result.entity.userId !== req.user.id) {
    return res.status(403).send("Forbidden");
  }

  const url = await getPresignedUrl(result.key, {
    inline: false,
    filename: result.entity.name,
    expiresIn: 60 * 60,
  });

  res.redirect(302, url);
}

export default {
  renderIndex,
  uploadImage,
  submitfolder,
  deleteEntity,
  getEntity,
  previewFile,
  downloadFile,
};