'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('metadata', {
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
        }
      },
      fileType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      originalFilename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('metadata');
  }
};
