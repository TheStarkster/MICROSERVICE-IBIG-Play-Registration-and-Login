const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const Group = db.define('groups', {
    groupid: {
        type: Sequelize.BIGINT
    },
    userid: {
        type: Sequelize.BIGINT
    },
    isAdmin: {
        type: Sequelize.BOOLEAN
    },
})

module.exports = Group