//jshint esversion:6

require('dotenv').config()
const bodyParser=require("body-parser");
const ejs=require("ejs");
const express=require("express");
const { appendFile } = require("fs");
const mongoose=require("mongoose");
//const mongooseEncryption=require("mongoose-encryption");

//const md5=require("md5");
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app =express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{ useNewUrlParser: true});


var userSchema=new mongoose.Schema({
    email: String,
    password: String
});

//console.log(process.env.SECRET);
//userSchema.plugin(mongooseEncryption, {secret: process.env.SECRET, encryptedFields: ["password"]});

const user= mongoose.model("User", userSchema);


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


app.post("/register", function(req,res)
{
    const userName=req.body.username;
    const password=req.body.password;

    bcrypt.hash(password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser=new user({
            email: userName,
            password: hash
        })

        newUser.save(function(err)
        {
            if(err)
            {
                console.log("failed to store");
            }
            else{
                res.render("secrets");
            }
        })



    });

}); 



app.post("/login", function(req,res)
{

    const userName=req.body.username;
    const password=req.body.password;

    user.findOne({email: userName}, function(err, foundData)
    {
        if(err)
        {
            console.log("error in process");
        }
        else{
            if(foundData)
            {
                bcrypt.compare(password, foundData.password, function(err, result) {
                    if(result===true)
                    {
                        res.render("secrets");
                    }
                    else{
                        console.log("data doesn't match");
                    }
                });
                
            }
        }
    })

})



app.listen(3000, function()
{
    console.log("server is listening on port 3000");
})
