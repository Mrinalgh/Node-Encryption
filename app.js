//jshint esversion:6

require('dotenv').config()
const bodyParser=require("body-parser");
const ejs=require("ejs");
const express=require("express");
const { appendFile } = require("fs");
const mongoose=require("mongoose");

const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app =express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
 // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{ useNewUrlParser: true});


var userSchema=new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//console.log(process.env.SECRET);
//userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET, encryptedFields: ["password"]});

const user= mongoose.model("User", userSchema);

passport.use(user.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("access token: "+accessToken);
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res)
{
    res.render("home");
})


//try to authenticate google side
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
  );


//once authenticated we will authenticate our side where this call back route comes into picture
// then it returns the access token or it calls the call back function
  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", function(req,res)
{
    res.render("login");
})

app.get("/register", function(req,res)
{
    res.render("register");
})

app.get("/submit", function(req,res)
{
    if(req.isAuthenticated)
    {
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req,res)
{
    const submittedData=req.body.secret;
    console.log(req.user);

    user.findById(req.user.id, function(err,foundData)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            foundData.secret=submittedData;
            foundData.save(function(err)
            {
                if(err)
                {
                    console.log("data unable to update"+err);
                }
                else{
                    res.redirect("/secrets");
                }
            })
        }
    })

})

app.get("/secrets", function(req,res)
{
    user.find({secret: {$ne: null}}, function(err, foundData)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            res.render("secrets",{foundUser: foundData});
        }
    })
})

app.post("/register", function(req,res)
{

    user.register({username: req.body.username}, req.body.password, function(err, user)
    {
        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res, function()
            {
                res.redirect("/secret");
            })
        }
    })
    
}); 



app.post("/login", function(req,res)
{

    //dont get confuse here this is the mogoose.local.model which you used to register the user and then serialized
    //if you change username to email deserialize will failed and your data will not match so login will failed
    //if you see mongodb database see email and password will be blank only username which you created during register
    //will have the data and same for password(used hashed one)
    const userData= new user({
        username: req.body.username,
        password: req.body.password
    });

    req.login(userData, function(err)
    {
        if(err)
        {
            console.log(err);
            res.redirect("/login");
        }
        else{
            passport.authenticate("local")(req,res, function()
            {
                res.redirect("/secrets");
            })
        }
    })
    
})

app.get("/logout", function(req,res)
{
    req.logOut();
    res.redirect("/");
})



app.listen(3000, function()
{
    console.log("server is listening on port 3000");
})
