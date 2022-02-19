if (process.env.NODE_ENV !== "production") { require("dotenv").config() }
const express = require("express");
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejs = require('ejs');
const utils=require("./models/utils")
const flash = require('connect-flash')
const ejsMate = require('ejs-mate');
const checksum_lib=require("./Patym/checksum");
const config=require("./Patym/config");
const Volunteer=require('./models/volunteer');
const hos=require("./hospital")
const session = require('express-session')
const methodOverride = require('method-override')
const userRoutes = require('./routes/users.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

mongoose.connect('mongodb://localhost:27017/dire', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind('console', "connection error:"))
db.once("open", () => {
  console.log("Database connected")
})


app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.engine('ejs', ejsMate)

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"))
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });
app.use(express.static(path.join(__dirname, "public")))

app.use('/volunteer', userRoutes);

app.get('/', (req, res) => {
    res.render("home");
})

app.get('/donate/other', (req, res) => {
    res.render("donate/other");
})
app.post('/donate/other', (req, res) => {
    const data=req.body;
    console.log(data.util.pincode)
    let found = hos.hospital.filter((e) => {
      if (e.Pin_Code === data.util.pincode) {
          return e;
      }
    }
)
console.log(found)
  res.render("donate/center")
  })
app.get('/donate/money',(req,res)=>{
    res.render("donate/money");
})

app.post("/paynow", [parseUrl, parseJson], (req, res) => {
    // Route for making payment
  
    var paymentDetails = {
      amount: req.body.amount,
      customerId: req.body.name,
      customerEmail: req.body.email,
      customerPhone: req.body.phone
  }
  if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
      res.status(400).send('Payment failed')
  } else {
      var params = {};
      params['MID'] = config.PaytmConfig.mid;
      params['WEBSITE'] = config.PaytmConfig.website;
      params['CHANNEL_ID'] = 'WEB';
      params['INDUSTRY_TYPE_ID'] = 'Retail';
      params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
      params['CUST_ID'] = paymentDetails.customerId;
      params['TXN_AMOUNT'] = paymentDetails.amount;
      params['CALLBACK_URL'] = 'http://localhost:3000/callback';
      params['EMAIL'] = paymentDetails.customerEmail;
      params['MOBILE_NO'] = paymentDetails.customerPhone;
  
  
      checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
          var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
          // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
  
          var form_fields = "";
          for (var x in params) {
              form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
          }
          form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
  
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
          res.end();
      });
  }
  });


  app.post("/callback", (req, res) => {
    // Route for verifiying payment
  
    var body = '';
  
    req.on('data', function (data) {
       body += data;
    });
  
     req.on('end', function () {
       var html = "";
       var post_data = qs.parse(body);
  
       // received params in callback
       console.log('Callback Response: ', post_data, "\n");
  
  
       // verify the checksum
       var checksumhash = post_data.CHECKSUMHASH;
       // delete post_data.CHECKSUMHASH;
       var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
       console.log("Checksum Result => ", result, "\n");
  
  
       // Send Server-to-Server request to verify Order Status
       var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};
  
       checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
  
         params.CHECKSUMHASH = checksum;
         post_data = 'JsonData='+JSON.stringify(params);
  
         var options = {
           hostname: 'securegw-stage.paytm.in', // for staging
           // hostname: 'securegw.paytm.in', // for production
           port: 443,
           path: '/merchant-status/getTxnStatus',
           method: 'POST',
           headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             'Content-Length': post_data.length
           }
         };
  
  
         // Set up the request
         var response = "";
         var post_req = https.request(options, function(post_res) {
           post_res.on('data', function (chunk) {
             response += chunk;
           });
  
           post_res.on('end', function(){
             console.log('S2S Response: ', response, "\n");
  
             var _result = JSON.parse(response);
               if(_result.STATUS == 'TXN_SUCCESS') {
                   res.send('payment sucess')
               }else {
                   res.send('payment failed')
               }
             });
         });
  
         // post the data
         post_req.write(post_data);
         post_req.end();
        });
       });
  });



app.get('/volunteer',async(req , res)=>{
    const volunteers=await Volunteer.find({});
    res.render('volunteer/index',{ volunteers})
})

app.get('/volunteer/new',(req,res)=>{
   res.render('volunteer/new');
})

app.get('/volunteer/:id', async(req,res)=>{
      const {id}=req.params;
      const volunteer=await Volunteer.findById(id);
      
      res.render('volunteer/show',{volunteer});
})

app.post('/volunteer', async(req,res)=>{
   const volunteer=new Volunteer({
      name:req.body.volunteer.name,
      email:req.body.volunteer.email,
      phone:req.body.volunteer.phone,
      gender:req.body.volunteer.gender,
      dob:req.body.volunteer.dob,
      occupation:req.body.volunteer.occupation,
      city:req.body.volunteer.city,
      state:req.body.volunteer.state,
      fieldInterest:req.body.volunteer.fieldInterest
   });
   await volunteer.save();
   res.redirect(`/volunteer/${volunteer._id}`);
 
})

app.get('/volunteer/:id/edit',async(req,res)=>{
     const {id} =req.params;
     const volunteer=await Volunteer.findById(id);
     res.render('volunteer/edit',{volunteer});
})

app.put('/volunteer/:id', async(req,res)=>{
    const {id}=req.params;
    const volunteer=await Volunteer.findByIdAndUpdate(id,{
      name:req.body.volunteer.name,
      email:req.body.volunteer.email,
      phone:req.body.volunteer.phone,
      gender:req.body.volunteer.gender,
      dob:req.body.volunteer.dob,
      occupation:req.body.volunteer.occupation,
      city:req.body.volunteer.city,
      state:req.body.volunteer.state,
      fieldInterest:req.body.volunteer.fieldInterest
   }); 
    //  console.log(volunteer);
    res.redirect(`/volunteer/${volunteer._id}`);
  })

app.delete('/volunteer/:id', async(req,res)=>{
    const {id}=req.params;
    const volunteer=await Volunteer.findById(id);
    await Volunteer.findByIdAndDelete(id);
    // console.log(volunteer);
    res.redirect('/volunteer');
})



app.listen(3000, () => {
    console.log("Listening on port 3000");
})