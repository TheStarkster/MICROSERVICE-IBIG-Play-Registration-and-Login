const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./config/connection/db')
const TempUser = require('./models/tuser')
const User = require('./models/user')

var OTP = Math.floor(100000 + Math.random() * 900000).toString()
// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/:phone', (REQ,RES) => {
    TempUser.create({phone:REQ.params.phone, otp: OTP})
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
              "numbers": REQ.params.phone,
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

app.get('/register-user/:phone',(REQ,RES) => {
    User.create({phone:REQ.params.phone})
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

app.listen('2643')
db.authenticate()
  .then(() => console.log('[Database Connected]'))
  .catch(err => console.log('Error: ' + err))