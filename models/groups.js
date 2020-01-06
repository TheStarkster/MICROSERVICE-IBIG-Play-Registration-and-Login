const Sequelize = require('sequelize');
const db = require('../config/connection/db');

const Group = db.define('groups', {
    groupname: {
        type: Sequelize.STRING
    },
    userid: {
        type: Sequelize.BIGINT
    },
    admin: {
        type:Sequelize.ARRAY(Sequelize.BIGINT)
    },
    numberOfParticipants:{
        type: Sequelize.BIGINT
    }
})

module.exports = Group