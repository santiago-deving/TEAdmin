const express = require('express');
const app = express();
const session = require("express-session");
require("dotenv").config();

const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const port = process.env.PORT || 3000;

var path = require('path');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

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

/////////////////////////////////////
///////////// Rotas GET//////////////
/////////////////////////////////////

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
    try {
        const client = await db.connect();
        const result = await client.query('SELECT * FROM teadmin.pacientes');
        console.log(result.rows);
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar pacientes' });
    }
});

app.get('/api/agendamentos', verificarLogin, async (req, res) => {
    try {
        const client = await db.connect();
        const result = await client.query(`
            SELECT 
                c.id_consulta,
                p.nome || ' ' || p.sobrenome AS title,
                c.data_consulta::text || 'T' || c.hora_consulta::text AS start
            FROM teadmin.consulta c
            JOIN teadmin.pacientes p ON c.id_paciente = p.id_paciente
        `);
        client.release();
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
    }
});

//////////////////////////////////
///////////Rotas POST/////////////
//////////////////////////////////

app.post("/login_send", validac_login, async (req, res) => {
    req.session.usuario = "usuario existente";
    res.redirect("/pacientes");
});

app.listen(port, () => {
    console.log(`Express rodando em: http://0.0.0.0:${port}`);
});