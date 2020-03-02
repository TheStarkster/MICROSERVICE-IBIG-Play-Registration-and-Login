const Sequelize = require("sequelize");

// Option 1: Passing parameters separately
const DB = new Sequelize(
  "dbio06ga4o4oj9",
  "rmghyielbaytsl",
  "aa2a183117a59dbfae018860af75cb02a3dc476ebbc414f77e83b7f8aa0e6dcd",
  {
    host: "ec2-107-21-255-181.compute-1.amazonaws.com",
    dialect: "postgres",
    dialectOptions: {
      ssl: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = DB;
