const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const Message = db.define('messages', {
    sender: {
        type: Sequelize.BIGINT
    },

    receiver: {
        type: Sequelize.BIGINT
    },
    message: {
        type: Sequelize.STRING
    },
    read: {
        type: Sequelize.BOOLEAN
    },
    received:{
        type: Sequelize.BOOLEAN
    },
    sender_phone: {
        type: Sequelize.STRING
    }
})

module.exports = Message