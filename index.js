const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./config/connection/db')
const TempUser = require('./models/tuser')
const User = require('./models/user')
const Messages = require('./models/messages')
const Fadmin = require('firebase-admin');
const RequestModal = require('./models/requests')
const serviceAccount = require("./ibig-play-firebase-adminsdk-5yba6-e8daa651a8.json")

Fadmin.initializeApp({
    credential: Fadmin.credential.cert(serviceAccount),
    databaseURL: "https://ibig-play.firebaseio.com"
});
// Body Parser...
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/:phone', (REQ, RES) => {
    var OTP = Math.floor(10000 + Math.random() * 90000).toString()
    TempUser.create({ phone: REQ.params.phone.split(" ")[1].trim(), otp: OTP })
        .then(u => {
            if (u) {
                var unirest = require("unirest");
                var req = unirest("POST", "https://www.fast2sms.com/dev/bulk");
                req.headers({
                    "content-type": "application/x-www-form-urlencoded",
                    "cache-control": "no-cache",
                    "authorization": "oUvs89JdohAlMAkzdLn7vLiUTzBi0fiHVoD4pJPVQ4X1vM8kw2O6YwYydalr"
                });
                req.form({
                    "sender_id": "FSTSMS",
                    "language": "english",
                    "route": "qt",
                    "numbers": REQ.params.phone.split(" ")[1].trim(),
                    "message": "17485",
                    "variables": "{#AA#}",
                    "variables_values": OTP.toString()
                });
                req.end(function (res) {
                    if (res.error) throw new Error(res.error);
                    console.log(res.body);
                });
                RES.send({
                    otp: OTP
                })
            }
        })
})

app.get('/register-user/:phone/:token', (REQ, RES) => {
    User.create({ phone: REQ.params.phone, token: REQ.params.token })
        .then(u => {
            console.log(u.user)
            RES.send(u)
        })
})

app.get('/find-user/:phone', (REQ, RES) => {
    User.findAll({
        where: {
            phone: REQ.params.phone
        }
    })
        .then(u => {
            if (u) {
                RES.send({
                    message: u
                })
            } else {
                RES.send({
                    message: "404"
                })
            }
        })
})

app.get('/send-request/:receiver/:sender', (REQ, RES) => {
    User.findAll({
        where: {
            phone: REQ.params.receiver
        },
        raw: true
    })
        .then(u => {
            console.log(u)
            Fadmin.messaging().sendToDevice(u[0].token, {
                notification: {
                    title: "Notification",
                    body: REQ.params.sender + " wants to text you!",
                    sound: "default"
                },
                data: {
                    "sendername": "IBIG",
                    "message": "its a Request Message!"
                }
            })
                .then(u => {
                    RES.sendStatus(200)
                })
        })
})
app.post('/save-message', (REQ, RES) => {
    if (REQ.body.code == null) {
        Messages.create({
            message: REQ.body.message,
            sender: parseInt(REQ.body.sender),
            receiver: parseInt(REQ.body.receiver_id),
            read: false
        })
            .then(u => {
                RES.sendStatus(200)
            })
    } else {
        console.log(REQ.body)
        RequestModal.create({
            from :parseInt(REQ.body.sender),
            to: parseInt(REQ.body.receiver_id),
        }).then(u => {
            RES.send(u);
        })
    }

})
app.get('/get-messages/:of', (REQ, RES) => {
    Messages.findAll({
        where: {
            receiver: parseInt(REQ.params.of),
            read: false,
            received: false
        },
        raw: true
    })
        .then(u => {
            Messages.update({
                received: true
            },
                {
                    where: {
                        receiver: parseInt(REQ.params.of),
                        read: false,
                        received: false
                    }
                }
            )
                .then(r => {
                    RES.send(u)
                })
        })
})
app.post('/read-message', (REQ, RES) => {
    var res_ids = REQ.body.message_ids;
    res_ids = res_ids.replace(/[\[\]']+/g, '');
    var ids = res_ids.split(",");
    Messages.update({
        read: true
    }, {
        where: {
            id: ids
        }
    }).then(u => {
        if (u) {
            RES.sendStatus(200)
        }
    })
})

app.get('/accept-request/:id', (REQ, RES) => {
    RequestModal.destroy({
        where: {
            id: REQ.params.id
        }
    })
})
app.get('/reject-request/:id', (REQ, RES) => {
    RequestModal.destroy({
        where: {
            id: REQ.params.id
        }
    })
})

app.listen('2643')
db.authenticate()
    .then(() => console.log('[Database Connected]'))
    .catch(err => console.log('Error: ' + err))