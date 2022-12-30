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
const { use } = require('passport');


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
    password: String
});

userSchema.plugin(passportLocalMongoose);

//console.log(process.env.SECRET);
//userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET, encryptedFields: ["password"]});

const user= mongoose.model("User", userSchema);

passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());


app.get("/", function(req, res)
{
    res.render("home");
})

app.get("/login", function(req,res)
{
    res.render("login");
})

app.get("/register", function(req,res)
{
    res.render("register");
})

app.get("/secret", function(req,res)
{
    if(req.isAuthenticated())
    {
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
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
                res.redirect("/secret");
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
