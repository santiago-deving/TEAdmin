const express = require('express');
const app = express();
const session = require("express-session")
require("dotenv").config();
 
const db = require("./db");
const port = process.env.PORT || 3000 ;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.json());
app.use(session({
    secret: 'grupo12',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}))

app.get("/", (req,res)=>{
    res.render('inicio');
});

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://0.0.0.0:${port}`);
});