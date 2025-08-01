const bcrypt = require("bcryptjs");
const Sequelize = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { require: true }
    }
  }
);

const User = sequelize.define("User", {
  userName: {
    type: Sequelize.STRING,
    unique: true
  },
  password: Sequelize.STRING,
  email: Sequelize.STRING,
  loginHistory: Sequelize.JSONB 
});

module.exports.initialize = () => {
  return sequelize.sync();
};

module.exports.registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    bcrypt.hash(userData.password, 10).then(hash => {
      userData.password = hash;
      userData.loginHistory = [];

      User.create({
        userName: userData.userName,
        password: userData.password,
        email: userData.email,
        loginHistory: userData.loginHistory
      }).then(() => resolve())
        .catch(err => {
          if (err.name === "SequelizeUniqueConstraintError") {
            reject("User Name already taken");
          } else {
            reject("Error creating user: " + err.message);
          }
        });
    }).catch(() => reject("Error encrypting the password"));
  });
};

module.exports.checkUser = (userData) => {
  return new Promise((resolve, reject) => {
    User.findOne({ where: { userName: userData.userName } }).then(user => {
      if (!user) {
        reject("Unable to find user: " + userData.userName);
        return;
      }

      bcrypt.compare(userData.password, user.password).then(result => {
        if (!result) {
          reject("Incorrect Password for user: " + userData.userName);
          return;
        }

       
        const history = user.loginHistory || [];
        if (history.length >= 8) history.pop();
        history.unshift({ dateTime: new Date().toString(), userAgent: userData.userAgent });

        user.loginHistory = history;

        user.save().then(() => resolve(user))
          .catch(err => reject("Error updating login history: " + err));
      });
    }).catch(() => reject("Unable to find user: " + userData.userName));
  });
};
