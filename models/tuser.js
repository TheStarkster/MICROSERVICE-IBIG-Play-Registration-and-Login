const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const TempUser = db.define('temp_user', {
    phone: {
        type: Sequelize.STRING
    },
    otp: {
        type: Sequelize.STRING
    },
})

module.exports = TempUser