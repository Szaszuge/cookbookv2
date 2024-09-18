require('dotenv').config()
const express = require('express')
var mysql = require('mysql');
const uuid = require('uuid');
var cors = require('cors');
var CryptoJS = require("crypto-js");
var moment = require('moment');

const app = express();
const port = process.env.PORT;
const passwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

var pool  = mysql.createPool({
    connectionLimit : process.env.CONNECTIONLIMIT,
    host            : process.env.DBHOST,
    user            : process.env.DBUSER,
    password        : process.env.DBPASS,
    database        : process.env.DBNAME
  });

// get API version

app.get('/', (req, res) => {
    res.send(`API version : ${process.env.VERSION}`);
  });

// user regisztráció

app.post('/reg', (req, res) => {

// kötelező adatok ellenőrzése (telefonszám nem kötelező ezért nem kell ellenőrizni)

  if(!req.body.name || !req.body.email || !req.body.passwd || !req.body.confirmPasswd){
    res.status(400).send('Nem adtál meg minden kötelező adatot!');
    return;
  }

// jelszavak egyezésének leellenőrzése

  if(req.body.passwd != req.body.confirmPasswd){
    res.status(400).send('A megadott jelszavak nem egyeznek!')
  }

// jelszó minimum 8 karakter, legalább 1 kisbetű és 1 nagybetű és egy szám

  if(!req.body.passwd.match(passwdRegex)){
    res.status(400).send('A jelszó nem felel meg a kritériumoknak! (8 karakter, 1 szám, legalább 1 nagybetű)')
  }

// e-mail cím ellenőrzés

  pool.query(`SELECT * FROM users WHERE email='${req.body.email}'`, (err, results) => {
    if(err){
      res.status(500).send('Hiba történt az adatbázis elérése közben!');
      return;
    }

// ha már van ilyen e-mail cím

    if(results.length != 0){
      res.status(400).send('Ilyen e-mail címmel már regisztráltak te kukifely');
      return;
    }

// új felhasználó felvétele

    pool.query(`INSERT INTO users VALUES('${uuid.v4()}', '${req.body.name}', '${req.body.email}', SHA1('${req.body.password}'), 'user')`, (err, results) => {
      if(err){
        res.status(500).send('Hiba történt az adatbázisművelet közben!');
        return;
      }
      res.status(202).send('Sikeres regisztráció!');
      return;
    });
    return;
  });

});

//user bejelentkezés

app.post('/login', (req, res) => {
  if(!req.body.email || !req.body.passwd){
    res.status(400).send('Hiányzó adatok!');
    return;
  }

  pool.query(`SELECT ID, name, email, role FROM users WHERE email ='${req.body.email}' AND passwd='${CryptoJS.SHA1(req.body.passwd)}'`, (err, results) => {
    if(err){
      res.status(500).send('Hiba történt az adatbázis elérése közben!');
      return;
    }
    if(results.length == 0){
      res.status(203).send('Hibás belépési adatok!');
      return;
    }
    res.status(202).send(results);
    return;
  });
});