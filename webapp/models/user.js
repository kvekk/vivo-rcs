module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'users',
    timestamps: false
  });

  User.associate = models => {
    User.hasOne(models.settings, {
      foreignKey: 'userId',
      as: 'settings'
    });
    User.hasMany(models.metadata, {
      foreignKey: 'userId',
      as: 'metadata'
    });
  };

  return User;
};
