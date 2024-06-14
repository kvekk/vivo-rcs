const express = require('express');
const { metadata: Metadata } = require('../models');
const { deleteFromAzure } = require('../utils/azureBlobService');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.render('pages/requireLogin', { title: 'Access Denied' });
  }
  try {
    const metadata = await Metadata.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']]
    });
    res.render('pages/gallery', { title: 'Gallery', metadata });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/delete/:id', async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;
  try {
    const file = await Metadata.findOne({ where: { id, userId } });
    if (!file) {
      return res.status(404).send('File not found');
    }

    const blobName = file.fileUrl.split('/').pop();

    await Metadata.destroy({ where: { id } });

    await deleteFromAzure(blobName);

    res.redirect('/gallery');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/download/:id', async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;
  try {
    const file = await Metadata.findOne({ where: { id, userId } });
    if (!file) {
      return res.status(404).send('File not found');
    }

    const fileUrl = file.fileUrl;
    const fileName = file.originalFilename;

    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream'
    });

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.data.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
