const Sequelize = require('sequelize');
const db = require('../config/connection/db');
const User = db.define('user', {
    phone: {
        type: Sequelize.STRING
    },
    fname: {
        type: Sequelize.STRING
    },
    lname: {
        type: Sequelize.STRING
    },
    token: {
        type: Sequelize.STRING
    },
    groups: {
        type: Sequelize.DataTypes.ARRAY(Sequelize.STRING)
    },
    dp: {
        type: Sequelize.STRING
    },
    bio: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    cover_pics: {
        type: Sequelize.DataTypes.ARRAY(Sequelize.STRING)
    },
})

module.exports = User