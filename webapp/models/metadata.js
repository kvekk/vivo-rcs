module.exports = (sequelize, DataTypes) => {
  const Metadata = sequelize.define('metadata', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalFilename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'metadata',
    timestamps: false
  });

  Metadata.associate = models => {
    Metadata.belongsTo(models.user, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Metadata;
};
