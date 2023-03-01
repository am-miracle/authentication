//jshint esversion:6
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const dotenv = require("dotenv");
const mongoose = require("mongoose")
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5')
const bcrypt = require('bcrypt');
const saltRounds = 8;

dotenv.config({ path: '.env' });

const app =  express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect(process.env.CONNECTION_URL)

const userSchema =  new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SOME_LONG_UNGUESSABLE_STRING;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = mongoose.model("user", userSchema);


app.get("/", (req, res) => {
    res.render("home")
})
app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email: req.body.username,
            // password: md5(req.body.password)
            password: hash
        });

        newUser.save((err) => {
            if(err) {
                console.log(err)
            }
            else {
                res.render('secrets')
            }
        })
    });

})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err, foundUser) => {
        if(err){
            console.log(err)
        }
        else {
            if(foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    // result == true
                    if(result === true){
                        res.render('secrets')
                    } else{
                        console.log(err)
                    }
                });
                // if(foundUser.password === password) {
                //     res.render('secrets')
                // }
            }
        }
    })
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})