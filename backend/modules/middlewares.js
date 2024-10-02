const db = require('./database');
//logincheck function(bejelentkezés ellenőrzése)

function logincheck(req, res, next){
    let token = req.header('Authorization');
  
    if(!token){
      res.status(400).send('Jelentkezz befelé légyszives de most azonnal!');
      return;
    }
  
    db.query(`SELECT * FROM users WHERE ID='${token}'`, (err, results) => {
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

db.query(`SELECT role FROM users WHERE ID='${token}'`, (err, results) => {
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

module.exports = {
    logincheck,
    admincheck
}