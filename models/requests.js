const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const RequestModel = db.define('requests', {
    from: {
        type: Sequelize.STRING
    },
    to: {
        type: Sequelize.STRING
    },
    phone_of_from: {
        type: Sequelize.STRING
    },
})

module.exports = RequestModel