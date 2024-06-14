require('dotenv').config();

let raspberryPiIP = process.env.RASPBERRY_PI_IP;
let raspberryPiPort = parseInt(process.env.RASPBERRY_PI_PORT, 10);
let obstacleWarnings = false;

const getRaspberryPiIP = () => raspberryPiIP;
const getRaspberryPiPort = () => raspberryPiPort;
const getObstacleWarnings = () => obstacleWarnings;

const setRaspberryPiIP = (ip) => {
  if (ip) raspberryPiIP = ip;
};

const setRaspberryPiPort = (port) => {
  if (port) raspberryPiPort = port;
};

const setObstacleWarnings = (warnings) => {
  obstacleWarnings = warnings;
};

module.exports = {
  getRaspberryPiIP,
  getRaspberryPiPort,
  getObstacleWarnings,
  setRaspberryPiIP,
  setRaspberryPiPort,
  setObstacleWarnings,
};
