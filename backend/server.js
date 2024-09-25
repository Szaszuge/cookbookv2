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

//bejelentkezett felhasználó adatainak lekérése
app.get('/me/:id', logincheck, (req, res) => {
  if(!req.params.id){
    res.status(400).send('Hiányzol.. azonosító')
    return;
  }

  if(!req.body.name || !req.body.email || !req.body.role){
    res.status(400).send('Hiányzó adatok!');
    return;
  } 

//TODO aoi

  pool.query(`UPDATE users SET name='${req.body.name}', email='${req.body.email}', role='${req.body.role}' WHERE ID='${req.params.id}'`, (err, results) => {
    if(err){
      res.status(500).send('Hyba történt az adatbéz lekérése közben internális szerveri hiba')
      return;
    }

    if(results.affectedRows == 0){
      res.status(400).send('Hibás a zonosító.!')
      return;
    }

    res.status(200).send('Felhasználéói adatok módósítva')
    return;
  });
});

//jelszó módoshítás
app.patch('/passmod/:id', logincheck, (req, res) => {
  if(!req.params.id){
    res.status(400).send('Hiányzó adatok!!!');
    return;
  }

  if(!req.body.oldpass || !req.body.newpass || req.body.confirm){
    res.status(400).send('HIányo transports: ["websocket"]znak az adatok!l')
    return;
  }
//jelszó ellenőrzés
if(req.body.newpass != req.body.confirm){
  res.status(400).send("A jelszavak nem egyeznek")
  return;
}

//jelszó minimum kritériumoknak való megfelelése

if(!req.body.newpass.match(passwdRegex)){
  res.status(400).send("A jelszó nem felel meg a követelményeknek")
  return;
}

//megnézzük hogy jó-e a jelenlegi jelszó segítsenek rajtam ugandai gyerekmunkás vagyok
pool.query(`SELECT passwd FROM users WHERE ID='${req.params.id}'`, (err, results) => {
  if(err){
    res.status(500).send('Hiba történt az adatbázis lekérése közben. Kérem keresse fel a rendszergazdát, vagy hívják fel segélyszolgálatunkat a 06 20 561 6580 telefonszámon.')
    return;
  }

  if(results.length == 0){
  res.status(400).send('Hibás azonosító!')
  return;
  }

  if(results[0].passwd != CryptoJS.SHA1(req.body.oldpass)){
    res.status(400).send('A jelenlegi jelszó nem megfelelő!');
    return;
  }
  
  pool.query(`UPDATE users SET passwd=SHA1('${req.body.newpass}') WHERE ID='${req.params.id}'`, (err, results) => {
    if(err){
      res.status(500).send('Hiba történt adatbázis lekérése közben!');
      return;
    }

    if(results.affectedRows == 0){
      res.status(400).send('Azonosító nem található az adatbázisban!');
      return;
    }

    res.status(200).send('Jelszó módosítva!')
    return;
  });
  
});

});

// felhasználók listája (admin funkció)

app.get('/users', admincheck, (req, res) => {
  pool.query(`SELECT ID, name, email, role FROM users`, (err, results) => {
    if(err){
      res.status(500).send('Hiba történt az adatbázis elérése közben!');
      return;
    }
    res.status(200).send(results);
    return;
  });
});

// id alapján felhasználó adatainak lekérése (admin funkció)
app.get('/users/:id', logincheck, (req, res) => {
  if(!req.params.id){
    res.status(203).send('Hiányzó adatok!');
    return;
  }

  pool.query(`SELECT name, email, role FROM users WHERE ID='${req.params.id}'`, (err, results) => {
    if(err){
      res.status(500).send('Internal server error');
      return;
    }

    if(results.length == 0){
      res.status(400).send('Hibás a zonosító!')
      return;
    }

    res.status(202).send(results)
    return;

  });
});

// felhasználó törlése ID alapján (admin funkció)
app.delete('users/:id', logincheck, (req, res) => {
  if(!req.params.id)  {
    res.status(203).send('Hiányzó azonosító!');
    return;
  }

  pool.query(`DELETE FROM users WHERE ID='${req.params.id}'`, (err, results) => {
    if(err){
      res.status(500).send('Internal server error')
      return;
    }

    if(results.affectedRows == 0){
      res.status(400).send('Hibás azonosító')
      return;
    }

    res.status(202).send('Felhasználó törölve. Most jól kibasztál vele. Remélem büszke vagy magadra.')
    return;
  });
});



//irja ki ez a szar ha mukodik

app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});

//MIDDLEWARE funkcicók

//logincheck function(bejelentkezés ellenőrzése)

function logincheck(req, res, next){
  let token = req.header('Authorization');

  if(!token){
    res.status(400).send('Jelentkezz befelé légyszives de most azonnal!');
    return;
  }

  pool.query(`SELECT * FROM users WHERE ID='${token}'`, (err, results) => {
    if(err){
      res.status(203).send("Anyád")
      return;
    }

    if(results.length == 0){
      res.status(400).send('Hibás authentikáció!')
      return;
    }

    next();
  });

  return;
}


//admin-e vagy-e csekkolás-e

function admincheck(req, res, next){
  let token = req.header('Authorization');

  if(!token){
    res.status(400).send('Jelentkezz be lécike:3x3<3!');
    return;
  }

  pool.query(`SELECT role FROM users WHERE ID='${token}'`, (err, results) => {
    if(err){
      res.status(203).send('Hiba történt szóva');
      return;
    }

    if(results[0].role != 'admin'){
      res.status(400).send('Nincsen jogosultságod!')
      return;
    }

    next();
  });

  return;
}







