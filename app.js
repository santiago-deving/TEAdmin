const express = require('express');
const session = require("express-session");
var bodyParser = require('body-parser');
const path = require('path');

require("dotenv").config();

const app = express();
const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const { calcFreq } = require('./middlewares/dataFunctions');
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

app.get("/painel_admin", verificarLogin([2]),(req, res) => {
    res.render('painel-admin');
});

app.get("/painel_pais", verificarLogin([0]) ,(req, res) => {
    res.render('painel-pais');
});

app.get('/painel_terapeutas', verificarLogin([1]), (req, res) => {
    res.render('painel-terapeuta', {user: req.session.usuario});
});

app.get("/calendario", (req, res) => {
    res.render('calendario');
});

app.get("/cadastro-paciente", verificarLogin([2]), (req, res) => {
    res.render('cadastro-paciente');
});

app.get("/cadastro-responsavel", verificarLogin([2]), (req, res) => {
    res.render('cadastro-responsavel');
});

app.get("/pacientes", verificarLogin, async (req, res) => {
    try {
        const client = await db.connect();
        const result = await client.query('SELECT * FROM teadmin.pacientes');
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

app.get('/send_user', (req, res) => {
  res.send(req.session.usuario);
})

app.get('/send_paciente_dados', verificarLogin(), async (req, res) => {
    try {
        const user = req.session.usuario;
        const client = await db.connect();

        let result;

        if (user.tipo === 2) {
            result = await client.query(`
                SELECT c.id_consulta, c.id_paciente, c.id_status, c.hora_consulta, c.data_consulta,
                       p.nome, p.sobrenome
                FROM teadmin.consulta c
                JOIN teadmin.pacientes p ON p.id_paciente = c.id_paciente
                ORDER BY c.data_consulta
            `);
        } else if (user.tipo === 1) {
            result = await client.query(`
                SELECT c.id_consulta, c.id_paciente, c.id_status, c.hora_consulta, c.data_consulta,
                       p.nome, p.sobrenome
                FROM teadmin.consulta c
                JOIN teadmin.pacientes p ON p.id_paciente = c.id_paciente
                WHERE c.id_profissional = $1
                ORDER BY c.data_consulta
            `, [user.id_profissional]);
        } else if (user.tipo === 0) {
            const id_pacienteRaw = await client.query(
                'SELECT id_paciente FROM teadmin.paciente_responsavel WHERE id_responsavel = $1',
                [user.id_responsavel]
            );
            const id_paciente = id_pacienteRaw.rows[0].id_paciente;
            result = await client.query(`
                SELECT c.id_consulta, c.id_paciente, c.id_status, c.hora_consulta, c.data_consulta,
                       p.nome, p.sobrenome
                FROM teadmin.consulta c
                JOIN teadmin.pacientes p ON p.id_paciente = c.id_paciente
                WHERE c.id_paciente = $1
            `, [id_paciente]);
        }

        const consultasRaw = result.rows;
        const consultasLista = [];
        const pacientes = [];

        for (const i of consultasRaw) {
            if (!pacientes.some(p => p.id_paciente === i.id_paciente)) {
                pacientes.push({
                    id_paciente: i.id_paciente,
                    nome: i.nome,
                    sobrenome: i.sobrenome
                });
            }
            consultasLista.push({
                id_paciente:   i.id_paciente,
                nome:          i.nome,
                sobrenome:     i.sobrenome,
                id_consulta:   i.id_consulta,
                id_status:     i.id_status,
                hora_consulta: i.hora_consulta,
                data_consulta: i.data_consulta
            });
        }

        client.release();
        res.json({ pacientes, consultasLista });
    } catch (error) {
        res.send(`Erro: ${error}`);
    }
});

app.get('/ver_freq', verificarLogin(), async (req, res) => {
    try {
        const id_paciente = req.query.id_paciente;
        const id_profissional = req.query.id_profissional;
        const frequencia = await calcFreq(id_paciente, id_profissional, req);
        return res.json(frequencia);
    } catch (error) {
        res.send(`Erro: ${error}`);
    }
});

app.get('/ver_freq/todos', verificarLogin(), async (req, res) => {
    try {
        const user = req.session.usuario;
        const tipo = parseInt(user.tipo);
        
        if (tipo === 1) {
            pacientes = await client.query(`
                SELECT DISTINCT id_paciente FROM teadmin.consulta WHERE id_profissional = $1
            `, [user.id_profissional]);
        } else if (tipo === 2) {
            pacientes = await client.query(`SELECT DISTINCT id_paciente FROM teadmin.consulta`);
        }

        const freqs = {};
        for (const p of pacientes.rows) {
            let result;
            if (user.tipo === 1) {
                result = await client.query('SELECT calcfreq($1, $2)', [p.id_paciente, user.id_profissional]);
            } else if (user.tipo === 2) {
                result = await client.query('SELECT calcfreq($1)', [p.id_paciente]);
            }
            freqs[String(p.id_paciente)] = result.rows[0].calcfreq;
        }

        client.release();
        res.json(freqs);
    } catch (error) {
        res.send(`Erro: ${error}`);
    }
});

///////////////////////////////////////////
/////////////// ROTAS POST //////////////// 
///////////////////////////////////////////

app.post("/login_send", validac_login, async (req, res) => {
    res.redirect("/");
});

app.post("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.post('/api/agendamentos', async (req, res) => {
  res.send('Sucesso!');
})

///////////////////////////////////////////
/////////////// ROTAS PUT //////////////// 
///////////////////////////////////////////

app.put('/atender_consulta', verificarLogin([1,2]), async function(req, res) {
    try {
        let id_consulta = req.query.id_consulta;
        const client = await db.connect();
        const result = await client.query('UPDATE teadmin.consulta SET id_status = 1 WHERE id_consulta = $1', [id_consulta]);

        client.release();

        res.send('Sucesso!');
    } catch(error) {
        console.log(error);
    }

});

//////////////////////////////////////////

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://localhost:${port}`);
});