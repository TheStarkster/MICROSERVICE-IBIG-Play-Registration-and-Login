const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const GroupMessage = db.define('group_messages', {
    sentby: {
        type: Sequelize.BIGINT
    },
    groupid: {
        type: Sequelize.BIGINT
    },
    message: {
        type: Sequelize.STRING
    },
})

module.exports = GroupMessage