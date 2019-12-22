const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./config/connection/db')
const TempUser = require('./models/tuser')
const User = require('./models/user')
const Fadmin = require('firebase-admin');
const Ffunctions = require('firebase-functions')
const serviceAccount = require("./ibig-play-firebase-adminsdk-5yba6-e8daa651a8.json")

Fadmin.initializeApp({
    credential: Fadmin.credential.cert(serviceAccount),
    databaseURL: "https://ibig-play.firebaseio.com"
    });
// Body Parser...
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/:phone', (REQ,RES) => {
    var OTP = Math.floor(10000 + Math.random() * 90000).toString()
    TempUser.create({phone:REQ.params.phone.split(" ")[1].trim(), otp: OTP})
    .then(u => {
        if(u){
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
                otp:OTP
            })
        }
    })
})

app.get('/register-user/:phone/:token',(REQ,RES) => {
    User.create({phone:REQ.params.phone,token:REQ.params.token})
    .then(u => {
        console.log(u)
        RES.send({
            message:"Created"
        })
    })
})

app.get('/find-user/:phone',(REQ,RES) => {
    User.findAll({
        where: {
            phone:REQ.params.phone
        }
    })
    .then(u => {
        if(u){
            RES.send({
                message: u
            })
        }else{
            RES.send({
                message: "404"
            })
        }
    })
})

app.get('/send-request/:phone',(REQ,RES) => {
    User.findAll({
        where: {
            phone:REQ.params.phone
        },
        raw:true
    })
    .then(u=>{
        console.log(u)
        Fadmin.messaging().sendToDevice(u[0].token,{
            notification: {
                title: "Notification",
                body: REQ.params.phone+" wants to text you!",
                sound: "default"
            },
            data:{
                "sendername":"IBIG",
                "message":"its a Request Message!"
            }
        })
        .then(u => {
            RES.sendStatus(200)
        })
    })
})
app.listen('2643')
db.authenticate()
  .then(() => console.log('[Database Connected]'))
  .catch(err => console.log('Error: ' + err))