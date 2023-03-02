//jshint esversion:6
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
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
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
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
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render("home")
})
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

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
            passport.authenticate('local')(req, response, () => {
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