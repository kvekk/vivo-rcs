const express = require('express');
const bcrypt = require('bcrypt');
const { user: User, settings: Settings } = require('../models');
const { sendSettingsToRaspberryPi } = require('./settings');
const router = express.Router();
const { setRaspberryPiIP, setRaspberryPiPort, setObstacleWarnings } = require('../config/global');

router.get('/login', (req, res) => {
  res.render('pages/login', { title: 'Login' });
});

router.get('/signup', (req, res) => {
  res.render('pages/signup', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (password.length < 6) {
      return res.status(400).render('pages/signup', { title: 'Register', errorMessage: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('pages/signup', { title: 'Register', errorMessage: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).render('pages/signup', { title: 'Register', errorMessage: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    await Settings.create({
      userId: user.id,
      speed: 70,
      steeringAngleStep: 5,
      obstacleWarnings: false,
      raspberryPiIP: process.env.RASPBERRY_PI_IP,
      raspberryPiPort: parseInt(process.env.RASPBERRY_PI_PORT, 10)
    });

    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).render('pages/signup', { title: 'Register', errorMessage: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;

      const settings = await Settings.findOne({ where: { userId: user.id } });
      if (settings) {
        setRaspberryPiIP(settings.raspberryPiIP);
        setRaspberryPiPort(settings.raspberryPiPort);
        setObstacleWarnings(settings.obstacleWarnings);
        sendSettingsToRaspberryPi(settings);
      }

      res.redirect('/');
    } else {
      res.render('pages/login', { title: 'Login', errorMessage: 'The username or password is incorrect.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
