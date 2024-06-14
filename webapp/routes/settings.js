const express = require('express');
const { settings: Settings } = require('../models');
const { setRaspberryPiIP, setRaspberryPiPort, setObstacleWarnings } = require('../config/global');
const router = express.Router();
const fetch = require('node-fetch');

const sendSettingsToRaspberryPi = async (settings) => {
  const settingsData = {
    speed: settings.speed,
    steeringAngleStep: settings.steeringAngleStep,
    obstacleWarnings: settings.obstacleWarnings,
    raspberryPiIP: settings.raspberryPiIP,
    raspberryPiPort: settings.raspberryPiPort,
  };
  const url = `http://${settings.raspberryPiIP}:${settings.raspberryPiPort}/update_settings`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
    });
    console.log('Settings sent to Raspberry Pi');
  } catch (error) {
    console.error('Error sending settings to Raspberry Pi:', error);
  }
};

router.get('/', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.render('pages/requireLogin', { title: 'Access Denied' });
  }
  try {
    const settings = await Settings.findOne({ where: { userId } });
    res.render('pages/settings', { title: 'Settings', settings });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/', async (req, res) => {
  const { speed, steeringAngleStep, obstacleWarnings, raspberryPiIP, raspberryPiPort } = req.body;
  const userId = req.session.userId;

  try {
    const settings = {
      userId,
      speed: parseInt(speed, 10),
      steeringAngleStep: parseInt(steeringAngleStep, 10),
      obstacleWarnings: obstacleWarnings === 'on',
      raspberryPiIP,
      raspberryPiPort: parseInt(raspberryPiPort, 10),
    };

    const [userSettings, created] = await Settings.upsert(settings, { returning: true });

    console.log('Updated settings:', userSettings); 

    if (settings.raspberryPiIP) setRaspberryPiIP(settings.raspberryPiIP);
    if (settings.raspberryPiPort) setRaspberryPiPort(settings.raspberryPiPort);
    setObstacleWarnings(settings.obstacleWarnings);

    sendSettingsToRaspberryPi(settings);

    res.redirect('/settings');
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
module.exports.sendSettingsToRaspberryPi = sendSettingsToRaspberryPi;
