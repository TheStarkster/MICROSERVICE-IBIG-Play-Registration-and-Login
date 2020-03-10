const express = require("express");
const bodyParser = require("body-parser");
const sequelize = require("sequelize");
const app = express();
const db = require("./config/connection/db");
const TempUser = require("./models/tuser");
const User = require("./models/user");
const Messages = require("./models/messages");
const Fadmin = require("firebase-admin");
const RequestModal = require("./models/requests");
const Groups = require("./models/groups");
const GroupsMessage = require("./models/group_messages");
const checksum_lib = require("./config/payments/checksum");
const serviceAccount = require("./ibig-play-e3f6f-firebase-adminsdk-yrpgu-72d559c009.json");

Fadmin.initializeApp({
  credential: Fadmin.credential.cert(serviceAccount),
  databaseURL: "https://ibig-play.firebaseio.com"
});
// Body Parser...
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb"
  })
);
app.use(express.static("public"));
app.use("/Images", express.static(__dirname + "/user_dp"));
app.use(
  bodyParser.json({
    extended: true,
    limit: "50mb"
  })
);

app.get("/register-user/:phone/:token", (REQ, RES) => {
  try {
    User.create({
      phone: REQ.params.phone,
      token: REQ.params.token
    }).then(u => {
      RES.send(u);
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/find-user/:phone/:user_id", (REQ, RES) => {
  try {
    var ResObj = [];
    User.findAll({
      where: {
        phone: {
          [sequelize.Op.like]: REQ.params.phone + "%"
        }
      },
      raw: true
    }).then(PhoneNumbers => {
      if (PhoneNumbers.length > 0) {
        RequestModal.findAll({
          where: {
            from: parseInt(REQ.params.user_id)
          },
          raw: true
        }).then(RequestSent => {
          PhoneNumbers.forEach(eachPhone => {
            ResObj.push({
              id: eachPhone.id,
              phone: eachPhone.phone,
              fullname: eachPhone.fname,
              token: eachPhone.token,
              dp: eachPhone.dp,
              isRequested: RequestSent.some(
                eachReq => parseInt(eachReq.to) === parseInt(eachPhone.id)
              )
                ? true
                : false
            });
          });
          RES.send({
            message: ResObj
          });
        });
      } else {
        RES.send({
          message: "404"
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/send-request/:receiver_id/:sender_id/:senderphone", (REQ, RES) => {
  try {
    RequestModal.findAll({
      where: {
        to: parseInt(REQ.params.receiver_id),
        from: parseInt(REQ.params.sender_id)
      },
      raw: true
    }).then(output => {
      if (output.length > 0) {
        RequestModal.destroy({
          where: {
            to: parseInt(REQ.params.receiver_id),
            from: parseInt(REQ.params.sender_id)
          },
          raw: true
        }).then(a => {
          RES.sendStatus(200);
        });
      } else {
        User.findAll({
          where: {
            id: parseInt(REQ.params.receiver_id)
          },
          raw: true
        }).then(u => {
          Fadmin.messaging()
            .sendToDevice(u[0].token, {
              notification: {
                title: "Notification",
                body: REQ.params.senderphone + " wants to text you!",
                sound: "default"
              },
              data: {
                sendername: "IBIG",
                message: "its a Request Message!"
              }
            })
            .then(r => {
              RES.sendStatus(200);
            });
          RequestModal.create({
            to: parseInt(REQ.params.receiver_id),
            from: parseInt(REQ.params.sender_id),
            phone_of_from: REQ.params.senderphone
          });
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});
app.post("/save-message-online", (REQ, RES) => {
  try {
    var res = JSON.parse(REQ.body.data);
    Messages.create({
      message: res.message,
      sender: parseInt(res.sender),
      receiver: parseInt(res.receiver_id),
      sender_phone: res.receiver_id,
      image: res.image,
      read: false,
      received: true
    }).then(u => {
      RES.send(u);
    });
  } catch (error) {
    console.log(error);
  }
});
app.post("/save-message", (REQ, RES) => {
  try {
    var res = JSON.parse(REQ.body.data);
    if (res.code !== "#<REQUEST>#" || res.code === null) {
      Messages.create({
        message: res.message,
        sender: parseInt(res.sender),
        receiver: parseInt(res.receiver_id),
        image: res.image,
        read: false
      }).then(u => {
        RES.sendStatus(200);
      });
    } else {
      RES.sendStatus(200);
    }
    User.findAll({
      where: {
        id: res.receiver_id
      }
    }).then(r => {
      Fadmin.messaging().sendToDevice(r[0].token, {
        notification: {
          title: "Notification",
          body: res.message,
          sound: "default"
        },
        data: {
          sendername: "IBIG",
          message: "Request Accepted"
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/get-messages/:of", (REQ, RES) => {
  try {
    Messages.findAll({
      where: {
        receiver: parseInt(REQ.params.of),
        read: false,
        received: false
      },
      raw: true
    }).then(u => {
      Messages.update(
        {
          received: true
        },
        {
          where: {
            receiver: parseInt(REQ.params.of),
            read: false,
            received: false
          }
        }
      ).then(r => {
        RES.send(u);
      });
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/get-requests/:user_id", (REQ, RES) => {
  try {
    var ResObj = [];
    RequestModal.findAll({
      where: {
        to: parseInt(REQ.params.user_id)
      },
      raw: true
    }).then(u => {
      RES.send(u);
    });
  } catch (error) {
    console.log(error);
  }
});
app.post("/read-message", (REQ, RES) => {
  try {
    var res_ids = REQ.body.message_ids;
    res_ids = res_ids.replace(/[\[\]']+/g, "");
    var ids = res_ids.split(",");
    Messages.update(
      {
        read: true
      },
      {
        where: {
          id: ids
        }
      }
    ).then(u => {
      if (u) {
        RES.sendStatus(200);
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/accept-request/:id", (REQ, RES) => {
  try {
    RequestModal.destroy({
      where: {
        id: REQ.params.id
      }
    }).then(u => {
      RES.sendStatus(200);
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/reject-request/:id", (REQ, RES) => {
  try {
    RequestModal.destroy({
      where: {
        id: REQ.params.id
      }
    }).then(u => {
      RES.sendStatus(200);
    });
  } catch (error) {
    console.log(error);
  }
});
app.post("/create-group", (REQ, RES) => {
  Groups.create({
    groupname: REQ.body.groupName,
    admin: JSON.parse(REQ.body.admin),
    numberOfParticipants: parseInt(REQ.body.numberOfParticipants)
  }).then(u => {
    User.update(
      {
        groups: sequelize.fn(
          "array_append",
          sequelize.col("groups"),
          u.dataValues.id.toString()
        )
      },
      {
        where: {
          id: JSON.parse(REQ.body.participants)
        }
      }
    ).then(a => {
      RES.send(JSON.stringify({ message: u.dataValues.id }));
    });
  });
});

app.post("/save-group-message-online", (REQ, RES) => {
  var res = JSON.parse(REQ.body.data);
  GroupsMessage.create({
    message: res.message,
    groupid: res.groupid,
    sentby: res.groupid
  }).then(u => {
    RES.send({
      message: u
    });
  });
});

app.post("/send-image-with-captions-to-one-or-more", (REQ, RES) => {
  try {
    var res = JSON.parse(REQ.body.data);
    // var bulk = []
    // var i = 0
    // res.receivers.forEach(receiver => {
    //     bulk.push({
    //         message: res.message,
    //         sender: parseInt(res.sender),
    //         receiver: parseInt(receiver),
    //         sender_phone: res.receiver_id,
    //         image:res.image,
    //         read: false,
    //         received: true
    //     })
    // });
    Messages.bulkCreate(res).then(u => {
      RES.send(u);
    });
  } catch (error) {
    console.log(error);
  }
});
app.get("/get-image-message/:id", (REQ, RES) => {
  Messages.findAll({
    where: {
      id: REQ.params.id
    },
    raw: true
  }).then(u => {
    if (u) {
      RES.send(u);
    }
  });
});

app.post("/change-profile-picture", (REQ, RES) => {
  var req = JSON.parse(REQ.body.data);
  require("fs").writeFile(
    "./user_dp/" + req.id + ".png",
    req.dp,
    { encoding: "base64" },
    err => console.log(err)
  );
  User.update(
    {
      dp: "http://162.241.71.139:2643/Images/" + req.id + ".png"
    },
    {
      where: { id: req.id }
    }
  ).then(u => {
    if (u) {
      RES.sendStatus(200);
    }
  });
});
app.post("/change-cover-picture", (REQ, RES) => {
  var req = JSON.parse(REQ.body.data);
  var i = 0;
  var p1 = new Promise(function(resolve, reject) {
    req.covers.forEach(element => {
      ++i;
      require("fs").writeFile(
        "./user_covers/" + req.id + "_" + i.toString() + ".png",
        element,
        { encoding: "base64" },
        err => console.log(err)
      );
      User.update(
        {
          cover_pics: sequelize.fn(
            "array_append",
            sequelize.col("cover_pics"),
            req.id + "_" + i.toString() + ".png"
          )
        },
        {
          where: { id: req.id }
        }
      ).then(u => {});
    });
    resolve("done");
  });
  p1.then(x => {
    RES.sendStatus(200);
  });
});
app.post("/change-bio", (REQ, RES) => {
  var req = JSON.parse(REQ.body.data);
  User.update(
    {
      bio: req.bio
    },
    {
      where: { id: req.id }
    }
  ).then(u => {
    if (u) {
      RES.sendStatus(200);
    }
  });
});
app.post("/change-name", (REQ, RES) => {
  var req = JSON.parse(REQ.body.data);
  User.update(
    {
      fname: req.fname
    },
    {
      where: { id: req.id }
    }
  ).then(u => {
    if (u) {
      RES.sendStatus(200);
    }
  });
});
app.post("/change-email", (REQ, RES) => {
  var req = JSON.parse(REQ.body.data);
  User.update(
    {
      email: req.email
    },
    {
      where: { id: req.id }
    }
  ).then(u => {
    if (u) {
      RES.sendStatus(200);
    }
  });
});
app.post("/add-to-group", (REQ, RES) => {
  // console.log("REQ.body.data")
  // console.log(REQ.body.data)
  // console.log("REQ.body.groupname")
  // console.log(REQ.body.groupname)
  // User.update(
  //     {groups:sequelize.fn('array_append',sequelize.col('groups'), 22)},
  //     {where: {id: REQ.body.creatorid}}
  //     ).then(u=> {
  //     RES.sendStatus(200)
  // })
});
app.get("/otp/:phone", (REQ, RES) => {
  var OTP = Math.floor(10000 + Math.random() * 90000).toString();
  try {
    TempUser.create({
      phone: REQ.params.phone.split(" ")[1].trim(),
      otp: OTP
    }).then(u => {
      if (u) {
        var unirest = require("unirest");
        var req = unirest("POST", "https://www.fast2sms.com/dev/bulk");
        req.headers({
          "content-type": "application/x-www-form-urlencoded",
          "cache-control": "no-cache",
          authorization:
            "oUvs89JdohAlMAkzdLn7vLiUTzBi0fiHVoD4pJPVQ4X1vM8kw2O6YwYydalr"
        });
        req.form({
          sender_id: "FSTSMS",
          language: "english",
          route: "qt",
          numbers: REQ.params.phone.split(" ")[1].trim(),
          message: "17485",
          variables: "{#AA#}",
          variables_values: OTP.toString()
        });
        req.end(function(res) {
          if (res.error) throw new Error(res.error);
        });
        RES.send({
          otp: OTP
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

//PAYTM CONFIGURATION
var PaytmConfig = {
  mid: "uWBeeF60765697743692",
  key: "%Qvy3FG7aRSCiJG2",
  website: "WEBSTAGING"
};

var txn_url = "https://securegw-stage.paytm.in/order/process"; // for staging

var callbackURL = "http://162.241.71.139:2643/paymentReceipt";

//CORS ACCESS CONTROL
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/payment", (req, res) => {
  let paymentData = req.body;
  var params = {};
  params["MID"] = PaytmConfig.mid;
  params["WEBSITE"] = PaytmConfig.website;
  params["CHANNEL_ID"] = "WEB";
  params["INDUSTRY_TYPE_ID"] = "Retail";
  params["ORDER_ID"] = paymentData.orderID;
  params["CUST_ID"] = paymentData.custID;
  params["TXN_AMOUNT"] = paymentData.amount;
  params["CALLBACK_URL"] = callbackURL;
  params["EMAIL"] = paymentData.custEmail;
  params["MOBILE_NO"] = paymentData.custPhone;

  checksum_lib.genchecksum(params, PaytmConfig.key, (err, checksum) => {
    if (err) {
      console.log("Error: " + e);
    }

    var form_fields = "";
    for (var x in params) {
      form_fields +=
        "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
    }
    form_fields +=
      "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(
      '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
        txn_url +
        '" name="f1">' +
        form_fields +
        '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
    );
    res.end();
  });
});

app.post("/paymentReceipt", (req, res) => {
  let responseData = req.body;
  var checksumhash = responseData.CHECKSUMHASH;
  var result = checksum_lib.verifychecksum(
    responseData,
    PaytmConfig.key,
    checksumhash
  );
  if (result) {
    return res.send({
      status: 0,
      data: responseData
    });
  } else {
    return res.send({
      status: 1,
      data: responseData
    });
  }
});

app.post("/wallet/credit", (REQ, RES) => {
  var req = JSON.parse(REQ.body.data);
  var bal;
  User.findAll({ where: { id: req.id }, raw: true }).then(u => {
    bal = u[0].paytm_bal;
    console.log(u[0]);
    console.log(bal);
    console.log(req.amount);
    console.log(parseFloat(bal == null ? 0 : bal) + parseFloat(req.amount));
  });
  User.update(
    {
      paytm_bal: parseInt(bal) + parseInt(req.amount),
      paytm_orders: sequelize.fn(
        "array_append",
        sequelize.col("paytm_orders"),
        req.order
      )
    },
    {
      where: {
        id: req.id
      }
    }
  ).then(u => {
    RES.send({ message: "done" });
  });
});
app.listen("2643");
db.authenticate()
  .then(() => console.log("[Database Connected]"))
  .catch(err => console.log("Error: " + err));
