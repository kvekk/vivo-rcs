module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define('settings', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      unique: true
    },
    speed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 70,
      validate: {
        min: 20,
        max: 100
      }
    },
    steeringAngleStep: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10
      }
    },
    obstacleWarnings: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    raspberryPiIP: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    raspberryPiPort: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: 'settings',
    timestamps: false
  });

  Settings.associate = models => {
    Settings.belongsTo(models.user, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Settings;
};
