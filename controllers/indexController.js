import multer from "multer";
import { prisma } from "../lib/prisma.js";

function buildTree(items, parentId) {
  return items
    .filter(i => i.parentId === parentId)
    .map(i => ({
      ...i,
      children: buildTree(items, i.id)
    }));
}

function renderIndex(req, res) {
  const items = [
    { id: 1, name: "Root", type: "FOLDER", parentId: null },

    { id: 2, name: "My First File", type: "FILE", size: 1024, mimeType: "text/plain", parentId: 1 },

    { id: 3, name: "67", type: "FOLDER", parentId: 1 },

    { id: 4, name: "bb.png", type: "FILE", size: 657174, mimeType: "image/png", parentId: 3 },

    { id: 5, name: "Sub Folder", type: "FOLDER", parentId: 3 },

    { id: 6, name: "nested.txt", type: "FILE", size: 200, mimeType: "text/plain", parentId: 5 }
  ];

  const tree = buildTree(items, null)
  res.render("index", { tree, title: "Home" });
}

async function uploadImage(req, res) {
    console.log(req.file)

  if (!req.user) {
  return res.status(401).send('Not authenticated');
}

if (!req.file) {
  return res.status(400).send('No file uploaded');
}

  const newEntity = await prisma.entity.create({
    data: {
      name: req.file.originalname,
      type: 'FILE',
      size: req.file.size,
      mimeType: req.file.mimetype,
      parentId: null,
      userId: req.user.id,
    }
  });

  res.send(`File ${newEntity.name} uploaded successfully! <br><a href='/'>Go Back</a>`);
}

async function submitfolder(req, res) {
  if (!req.user) {
  return res.status(401).send('Not authenticated');
}

  const newEntity = await prisma.entity.create({
    data: {
      name: req.body.folderName,
      type: 'FOLDER',
      size: 0,
      mimeType: null,
      parentId: null,
      userId: req.user.id,
    },
  });

  res.send(`Created entity with ID: ${newEntity.id} and type ${newEntity.type} <br><a href='/'>Go Back</a>`);
}


export default {
  renderIndex,
  uploadImage,
  submitfolder,
};