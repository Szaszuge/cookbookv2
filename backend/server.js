require('dotenv').config();
var cors = require('cors');
const express = require('express');
const app = express();
const port = process.env.PORT;
const userRoutes = require('./modules/users');

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/users', userRoutes); 


// get API version

app.get('/', (req, res) => {
    res.send(`API version : ${process.env.VERSION}`);
  });

//irja ki ez a szar ha mukodik

app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});








