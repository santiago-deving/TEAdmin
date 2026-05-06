const express = require('express');
const session = require("express-session");
var bodyParser = require('body-parser');
const path = require('path');

require("dotenv").config();

const app = express();
const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const port = process.env.PORT || 3000 ;

const e = require('express');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

app.use(bodyParser.json());
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

app.get("/", (req, res) => {
    
    if (!req.session || !req.session.usuario) {
        return res.redirect("/login");
    }

    let usuario = req.session.usuario;
    
    if (usuario.tipo === 0) {
        res.redirect('/painel_pais')
    } 
    if (usuario.tipo === 1) {
        res.redirect('/painel_terapeutas');
    } 
    if (usuario.tipo === 2) {
        res.redirect('/painel_admin')
    }
});

app.get("/login", (req, res) => {
    if (req.session.usuario) {
        res.redirect('/')
    } else {
        res.render('login');
    }
});

app.get("/painel_admin", verificarLogin(2),(req, res) => {
    res.render('painel-admin');
});

app.get("/painel_pais", (req, res) => {
    res.render('painel-pais');
});

app.get('/painel_terapeutas', verificarLogin(1), (req, res) => {
    console.log(req.session.usuario);
    res.render('painel-terapeuta', {user: req.session.usuario});
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

app.get('/send_user', (req, res) => {
  res.send(req.session.usuario);
})

app.get('/send_horarios', async (req, res) => {
    try {
        const client = await db.connect();
        const result = await client.query(`SELECT * FROM teadmin.consulta where id_profissional = ${req.session.usuario.id_profissional} ORDER BY data_consulta`);
        let consultasRaw = result.rows;
        let consultasLista = [];
        
        if (consultasRaw.length > 0) {
            for (const i of consultasRaw) {
                let paciente = await client.query(`SELECT id_paciente, nome, sobrenome FROM teadmin.pacientes where id_paciente = ${i.id_paciente}`);
                paciente = paciente.rows[0];
                paciente.id_consulta = i.id_consulta;
                paciente.hora_consulta = i.hora_consulta;
                paciente.data_consulta = i.data_consulta;
                consultasLista.push(paciente);
            }
        }

        console.log(consultasLista);
        client.release();

        res.send(consultasLista);
    } catch (error) {
        res.send(`Erro: ${error}`)
    }
})

///////////////////////////////////////////
/////////////// ROTAS POST //////////////// 
///////////////////////////////////////////

app.post("/login_send", validac_login, async (req, res) => {
    res.redirect("/");
});



// for routes looking like this `/products?page=1&pageSize=50`
app.get('/atender_consulta', verificarLogin(1), function(req, res) {
    let id_consulta = req.query.id_consulta;
    const client = await db.connect();
    const result = await client.query('UPDATE teadmin.consulta SET id_status = 1 WHERE id_consulta = $1', [id_consulta]);

    client.release();

    res.send('Sucesso!');
});



app.post('/api/agendamentos', async (req, res) => {
  res.send('Sucesso!');
})

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://localhost:${port}`);
});