'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        unique: true
      },
      speed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 70,
        validate: {
          min: 20,
          max: 100
        }
      },
      steeringAngleStep: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 10
        }
      },
      obstacleWarnings: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      raspberryPiIP: {
        type: Sequelize.STRING,
        allowNull: true
      },
      raspberryPiPort: {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  }
};
