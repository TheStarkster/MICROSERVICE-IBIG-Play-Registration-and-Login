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
        type: Sequelize.ARRAY(Sequelize.SMALLINT)
    },
})

module.exports = User