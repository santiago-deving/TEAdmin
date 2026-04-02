const express = require('express');
const app = express();
app.use(express.static('public'));
const session = require("express-session")
require("dotenv").config();
 
const db = require("./db");
const verificarLogin = require("./middlewares/auth");
const port = process.env.PORT || 3000 ;

var path = require('path');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

app.use(express.static(__dirname + '/public'));

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

app.get("/painel_pais",(req,res)=>{
    res.render('painel-pais');
})

app.get("/login", (req,res)=>{
    res.render('login')
})

app.get("/pacientes",verificarLogin, async (req,res)=>{
    const client = await db.connect();

    const result = await client.query('SELECT * FROM pacientes');

    console.log(result);

    client.release();

    res.json(`Acesso à área de pacientes: ${result.rows}`)
})

app.post("/logar",(req,res)=>{
    req.session.usuario = "usuario existente";
    res.send("login autorizado!");
})

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://0.0.0.0:${port}`);
});
