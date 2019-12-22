const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const Message = db.define('messages', {
    sender: {
        type: Sequelize.BIGINT
    },
    reciver: {
        type: Sequelize.BIGINT
    },
    message: {
        type: Sequelize.STRING
    },
    read: {
        type: Sequelize.BOOLEAN
    }
})

module.exports = Message