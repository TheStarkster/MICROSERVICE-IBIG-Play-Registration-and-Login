const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const Group = db.define('groups', {
    groupid: {
        type: Sequelize.BIGINT
    },
    userid: {
        type: Sequelize.BIGINT
    },
    admin: {
        type:Sequelize.ARRAY(Sequelize.STRING)
    },
    numberOfParticipants:{
        type: Sequelize.BIGINT
    }
})

module.exports = Group