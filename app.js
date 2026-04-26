const express = require('express');
const session = require("express-session");
const path = require('path');
require("dotenv").config();

const app = express();
const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const port = process.env.PORT || 3000 ;

const e = require('express');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
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
}));

///////////////////////////////////////////
/////////////// ROTAS GET ///////////////// 
///////////////////////////////////////////

app.get("/", verificarLogin,(req, res) => {
    res.redirect('/painel_admin');
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/painel_admin", (req, res) => {
    res.render('painel-admin');
});

app.get("/painel_pais", (req, res) => {
    res.render('painel-pais');
});

app.get('/painel_terapeutas', (req, res) => {
    res.render('painel-terapeutas');
});

app.get("/calendario", (req, res) => {
    res.render('calendario');
});

app.get("/pacientes", verificarLogin, async (req, res) => {
    try {
        const client = await db.connect();
        const result = await client.query('SELECT * FROM teadmin.pacientes');
        console.log(result.rows);
    client.release();

    const eventos = result.rows.map(c => ({
        title: c.nome + ' ' + c.sobrenome,
        start: c.data_consulta
    }));

        res.json(eventos);
    } catch (e) {
        console.log(e)
    }
    
})

app.get("/listar_pacientes", async(req,res)=>{
    try {
        const client = await db.connect();
        let pac = req.query.id_pac
        console.log(pac)
        let [result] = await client.query(`SELECT * FROM pacientes WHERE id_paciente = ${pac}`);
        console.log(result);
        res.send(result);
        client.release();
    } catch (e){
        res.send(e);
    }
});

///////////////////////////////////////////
/////////////// ROTAS POST //////////////// 
///////////////////////////////////////////

app.post("/login_send", validac_login, async (req, res) => {
    res.redirect("/");
});

app.post('/api/agendamentos', async (req, res) => {
  res.send('Sucesso!');
})

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://localhost:${port}`);
});