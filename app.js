const express = require('express');
const session = require("express-session");
const path = require('path');
require("dotenv").config();

const app = express();
const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const port = process.env.PORT || 3000;

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

app.get("/", (req, res) => {
    res.redirect('/login');
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
    const client = await db.connect();
    const result = await client.query('SELECT * FROM teadmin.pacientes');
    console.log(result.rows);
    client.release();
    res.json(`Acesso à área de pacientes: ${JSON.stringify(result.rows)}`);
});

app.get("/api/agendamentos", async (req, res) => {
    const client = await db.connect();
    const result = await client.query(`
        SELECT c.id_consulta, p.nome, p.sobrenome, c.data_consulta, c.hora_consulta
        FROM teadmin.consulta c
        JOIN teadmin.pacientes p ON c.id_paciente = p.id_paciente
    `);
    client.release();

    const eventos = result.rows.map(c => ({
        title: c.nome + ' ' + c.sobrenome,
        start: c.data_consulta
    }));

    res.json(eventos);
});

app.post("/login_send", validac_login, async (req, res) => {
    req.session.usuario = "usuario existente";
    res.redirect("/pacientes");
});

app.listen(port, () => {
    console.log(`Express rodando em: http://0.0.0.0:${port}`);
});