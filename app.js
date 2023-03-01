//jshint esversion:6
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5')
// const bcrypt = require('bcrypt');
// const saltRounds = 8;

dotenv.config({ path: '.env' });

const app =  express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const secret = process.env.SOME_LONG_UNGUESSABLE_STRING;

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.CONNECTION_URL)
mongoose.set('strictQuery', true);

const userSchema =  new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = mongoose.model("user", userSchema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home")
})
app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})
app.get("/secrets", (req, res) => {
    if(req.isAuthenticated()){
        res.render('secrets');
    } else{
        res.redirect('/login');
    }
});
app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return console.log(err);
    });
    res.redirect('/')
})

app.post("/register", (req, res) => {
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     const newUser = new User({
    //         email: req.body.username,
    //         // password: md5(req.body.password)
    //         password: hash
    //     });

    //     newUser.save((err) => {
    //         if(err) {
    //             console.log(err)
    //         }
    //         else {
    //             res.render('secrets')
    //         }
    //     })register
    // });
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err){
            console.log(err)
            res.redirect('/register')
        }
        else{
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    })

})

app.post('/login', (req, res) => {
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username}, (err, foundUser) => {
    //     if(err){
    //         console.log(err)
    //     }
    //     else {
    //         if(foundUser) {
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 // result == true
    //                 if(result === true){
    //                     res.render('secrets')
    //                 } else{
    //                     console.log(err)
    //                 }
    //             });
    //         }
    //     }
    // })

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (err) => {
        if (err) {
            console.log(err)
        }
        else{
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets')
            })
        }
    })
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})