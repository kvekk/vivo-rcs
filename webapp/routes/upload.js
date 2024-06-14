const express = require('express');
const multer = require('multer');
const { metadata: Metadata } = require('../models');
const { uploadToAzure }  = require('../utils/azureBlobService');
const router = express.Router();
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  res.render('pages/upload', { title: 'Upload File' });
});

router.post('/', upload.single('file'), async (req, res) => {
  const { file } = req;
  const userId = req.session.userId;

  const blobName = file.filename;
  const filePath = file.path;
  const fileExtension = path.extname(file.originalname).slice(1);

  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png'
  };
  
  const contentType = mimeTypes[fileExtension] || 'application/octet-stream';

  const fileUrl = await uploadToAzure(blobName, filePath, contentType);

  const originalFilename = blobName.split('-').slice(1).join('-');

  await Metadata.create({
    userId,
    fileType: file.mimetype,
    fileUrl,
    originalFilename,
    timestamp: new Date()
  });

  res.redirect('/gallery');
});

module.exports = router;
