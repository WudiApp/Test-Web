var express = require("express")
const bcrypt = require("bcrypt");
var session = require('express-session')
var mysql = require("mysql2")
require("dotenv").config();
var ejs = require("ejs")
let app = express();
var randomstring = require("randomstring");
var bodyParser = require('body-parser');
var path = require('path');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


var db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('index')
})
app.get('/register', function (req, res) {
    if (req.session.loggedin) {
        res.redirect("/me")
    } else {
        res.render("register")
    }
})
app.get("/login", (req, res) => {
    if (req.session.loggedin) {
        res.redirect("/me")
    } else {
        res.render("login");
    }
});

app.post('/login', (req, res) => {
    var username = req.body.email
    var password = req.body.password
    db.query("SELECT * FROM accounts WHERE email = ?", [username], async (error, result) => {
        if (result.length > 0) {
            let check = bcrypt.compareSync(password, result[0].passwort)
            if(check != true) return res.send("Incorrect Password!")
            req.session.loggedin = true;
            req.session.username = result[0].id
            res.redirect('/me');
        } else {
            res.send('Incorrect Username and/or Password!');
        }
        res.end();
    });
})
app.get('/me', (req, res) => {
    if (req.session.loggedin) {
        db.query("SELECT * FROM accounts WHERE id = ?", [req.session.username], async (error, result) => {
            res.render('me', {
                user: result[0].name + result[0].tag
            })
        })
    } else {
        res.redirect("/login")
    }
})
app.get('/user/{$id}', (req, res ) => {
    let id = "none"
    db.query("SELECT * FROM accounts WHERE id = ?", [id],)
    res.render("profiletemp")
})
app.post('/register', (req, res) => {
    var username = req.body.username
    var email = req.body.email
    var password = req.body.password
    var repeat = req.body.passwordrepeat
    db.query("SELECT * FROM accounts WHERE email = ?", [email], async (error, result) => {
        if (result.length > 0) {
            res.send("Sorry but this Email is already taken!")
        } else {
            if (password != repeat) {
                return res.send("Sorry but the passwords dosen't match!")
            } else {
                let id = await randomstring.generate({
                    length: 30,
                    charset: 'numeric'
                });
                let tgen = await randomstring.generate({
                    length: 4,
                    charset: 'numeric'
                })
                let tag = "#" + tgen
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password, salt);
                db.query("INSERT INTO accounts (name, email, passwort, id, tag) VALUES (?, ?, ?, ?, ?)", [username, email, hash, id, tag])
                res.redirect("/login")
            }
            res.end()
        }
    })
})
app.listen(3000, function () {
    console.log("Wudi Client has been started!")
})
