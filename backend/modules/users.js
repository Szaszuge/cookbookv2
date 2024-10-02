const uuid = require('uuid');
const express = require('express');
const router = express.Router();
var CryptoJS = require("crypto-js");
const db = require('./database');
const { logincheck, admincheck } =  require('./middlewares');
const passwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
const phoneRegex  = /^[0-9]*$/;

// user regisztráció

router.post('/reg', (req, res) => {

    // kötelező adatok ellenőrzése (telefonszám nem kötelező ezért nem kell ellenőrizni)
    
      if(!req.body.name || !req.body.email || !req.body.passwd || !req.body.confirmPasswd){
        res.status(400).send('Ném adtál meg minden kötelező adatot!');
        return;
      }
    
    // jelszavak egyezésének leellenőrzése
    
      if(req.body.passwd != req.body.confirmPasswd){
        res.status(400).send('A megadott jelszavak nem egyeznek!')
        return;
      }
    
    // jelszó minimum 8 karakter, legalább 1 kisbetű és 1 nagybetű és egy szám
    
      if(!req.body.passwd.match(passwdRegex)){
        res.status(400).send('A jelszó nem felel meg a kritériumoknak! (8 karakter, 1 szám, legalább 1 nagybetű)')
        return;
      }
    
    // telefonszám csak szám lehet
    
    if(!req.body.phone.match(phoneRegex)){
      res.status(400).send('A telefonszám nem tartalmazhat betűket vagy speciális karaktereket!')
      return;
    }
    
    // e-mail cím ellenőrzés
    
      db.query(`SELECT * FROM users WHERE email='${req.body.email}'`, (err, results) => {
        if(err){
          res.status(500).send('Hiba ctörtént az adatbázis elérése közben!');
          return;
        }
    
    // ha már van ilyen e-mail cím
    
        if(results.length != 0){
          res.status(400).send('Ilyen e-mail címmel már regisztráltak!');
          return;
        }
    
    // telefonszám ellenőrzés
    
    db.query(`SELECT * FROM users WHERE phone='${req.body.phone}'`, (err, results) => {
      if(err){
        res.status(500).send('Hibab történt az adatbázis elérése közben!')
        return;
      }
    
    // ha már van ilyen telefonszám
    
      if(results.length != 0){
        res.status(400).send('Ilyen telefonszámmal már regisztráltak!')
        return;
      }
    })
    
    // új felhasználó felvétele
    
        db.query(`INSERT INTO users VALUES('${uuid.v4()}', '${req.body.name}', '${req.body.email}', '${req.body.phone}', SHA1('${req.body.passwd}'), '0', '1')`, (err, results) => {
          if(err){
            res.status(500).send('Hibaá történt az adatbázisművelet közben!');
            return;
          }
          res.status(202).send('Sikeres regisztráció!');
          return;
        });
        return;
      });
    
    });
    
    //user bejelentkezés
    
    router.post('/login', (req, res) => {
      if(!req.body.email || !req.body.passwd){
        res.status(400).send('Hiányzó adatok!');
        return;
      }
    
      db.query(`SELECT ID, name, email, role FROM users WHERE email ='${req.body.email}' AND passwd='${CryptoJS.SHA1(req.body.passwd)}'`, (err, results) => {
        //console.log(CryptoJS.SHA1(req.body.passwd) == 'd5d4cd07616a542891b7ec2d0257b3a24b69856e')
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
    router.get('/me/:id', logincheck, (req, res) => {
      if(!req.params.id){
        res.status(400).send('Hiányzol.. azonosító')
        return;
      }
    
      if(!req.body.name || !req.body.email || !req.body.role){
        res.status(400).send('Hiányzó adatok!');
        return;
      } 
    
    //TODO aoi
    
      db.query(`UPDATE users SET name='${req.body.name}', email='${req.body.email}', role='${req.body.role}' WHERE ID='${req.params.id}'`, (err, results) => {
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
    router.patch('/passmod/:id', logincheck, (req, res) => {
      if(!req.params.id){
        res.status(400).send('Hiányzó adatok!!!');
        return;
      }
    
      if(!req.body.oldpass || !req.body.newpass || req.body.confirm){
        res.status(400).send('HIányoznak az adatok!l')
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
    db.query(`SELECT passwd FROM users WHERE ID='${req.params.id}'`, (err, results) => {
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
      
      db.query(`UPDATE users SET passwd=SHA1('${req.body.newpass}') WHERE ID='${req.params.id}'`, (err, results) => {
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
    
    router.get('/', admincheck, (req, res) => {
      db.query(`SELECT ID, name, email, role FROM users`, (err, results) => {
        if(err){
          res.status(500).send('Hiba történt az adatbázis elérése közben!');
          return;
        }
        res.status(200).send(results);
        return;
      });
    });
    
    // id alapján felhasználó adatainak lekérése (admin funkció)
    router.get('/:id', logincheck, (req, res) => {
      if(!req.params.id){
        res.status(203).send('Hiányzó adatok!');
        return;
      }
    
      db.query(`SELECT name, email, role FROM users WHERE ID='${req.params.id}'`, (err, results) => {
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
    router.delete('/:id', logincheck, (req, res) => {
      if(!req.params.id)  {
        res.status(203).send('Hiányzó azonosító!');
        return;
      }
    
      db.query(`DELETE FROM users WHERE ID='${req.params.id}'`, (err, results) => {
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

    module.exports = router;