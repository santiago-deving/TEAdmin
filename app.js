const express = require('express');
const app = express();
const session = require("express-session")
require("dotenv").config();
 
const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const port = process.env.PORT || 3000 ;

var path = require('path');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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

/////////////////////////////////////
///////////// Rotas GET//////////////
/////////////////////////////////////

app.get("/", verificarLogin, (req,res)=>{
    res.redirect('/painel_pais');
});

app.get("/painel_pais",(req,res)=>{
    res.render('painel-pais');
})

app.get("/login", (req,res)=>{
    res.render('login');
})

app.get("/painel_admin", (req,res)=>{
    res.render('painel-admin')
})

app.get('/painel_pais', (req, res) => {
  res.render('painel-pais')
})

app.get('/painel_terapeutas', (req, res) => {
  res.render('painel-terapeuta')
})

app.get("/calendario",(req,res)=>{
    res.render('calendario');
})

app.get("/pacientes",verificarLogin, async (req,res)=>{
    const client = await db.connect();

    const result = await client.query('SELECT * FROM pacientes');

    console.log(result.rows);

    client.release();

    res.json(`Acesso à área de pacientes: ${JSON.stringify(result.rows)}`)
})

//////////////////////////////////
///////////Rotas POST/////////////
//////////////////////////////////

app.post("/login_send", validac_login, async (req,res)=>{
    req.session.usuario = "usuario existente";
    res.redirect("/");
})

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://0.0.0.0:${port}`);
});
