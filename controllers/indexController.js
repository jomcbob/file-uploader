import { prisma } from "../lib/prisma.js";
import { s3 } from "../lib/s3.js";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";


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
    console.log(deepestEntity);
  }
  if (selectedFileId) {
    deepestEntity = await prisma.entity.findFirst({
      where: { id: selectedFileId },
      include: { childEntities: true }
    });
    console.log(deepestEntity);
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
      ACL: "public-read",
    })
  );

  const fileUrl = `${process.env.RAILWAY_BUCKET_ENDPOINT}/${process.env.RAILWAY_BUCKET_NAME}/${key}`;

  await prisma.entity.create({
    data: {
      name: req.file.originalname,
      type: "FILE",
      size: req.file.size,
      mimeType: req.file.mimetype,
      url: fileUrl,          // 👈 IMPORTANT
      parentId,
      userId: req.user.id,
    },
  });

  res.redirect("/");
}


async function submitfolder(req, res) {
  const parentId = parseInt(req.body.parentId, 10)
  console.log(parentId)
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

async function getEntityObject(id) {
  const entity = await prisma.entity.findUnique({ where: { id } });
  if (!entity || entity.type !== "FILE") return null;

  const key = entity.url.split(`${process.env.RAILWAY_BUCKET_NAME}/`)[1];

  const obj = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.RAILWAY_BUCKET_NAME,
      Key: key,
    })
  );

  return { entity, stream: obj.Body };
}

async function previewFile(req, res) {
  const result = await getEntityObject(Number(req.params.id));
  if (!result) return res.status(404).send("File Not found");

  const { entity, stream } = result;

  res.setHeader("Content-Type", entity.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${entity.name}"`
  );

  stream.pipe(res);
}

async function downloadFile(req, res) {
  const result = await getEntityObject(Number(req.params.id));
  if (!result) return res.status(404).send("Not found");

  const { entity, stream } = result;

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${entity.name}"`
  );

  stream.pipe(res);
}




export default {
  renderIndex,
  uploadImage,
  submitfolder,
  deleteEntity,
  getEntityObject,
  previewFile,
  downloadFile,
};