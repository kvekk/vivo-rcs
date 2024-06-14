const express = require('express'),
    router = express.Router(),
    { getRaspberryPiIP, getRaspberryPiPort, getObstacleWarnings } = require('../config/global');

router.get('/', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.render('pages/requireLogin', { title: 'Access Denied' });
    }

    res.render('pages/index', {
        title: 'VIVO RCS', 
        raspberryPiIP: getRaspberryPiIP(),
        raspberryPiPort: getRaspberryPiPort(),
        obstacleWarnings: getObstacleWarnings(),
    })
})

module.exports = router
