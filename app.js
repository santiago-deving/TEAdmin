const express = require('express');
const session = require("express-session");
var bodyParser = require('body-parser');
const path = require('path');

require("dotenv").config();

const app = express();
const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const port = process.env.PORT || 3000;

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
        res.redirect('/painel_pais');
    }
    if (usuario.tipo === 1) {
        res.redirect('/painel_terapeutas');
    }
    if (usuario.tipo === 2) {
        res.redirect('/painel_admin');
    }
});

app.get("/login", (req, res) => {
    if (req.session.usuario) {
        res.redirect('/');
    } else {
        res.render('login');
    }
});

app.get("/painel_admin", verificarLogin([2]), (req, res) => {
    res.render('painel-admin');
});

app.get("/painel_pais", verificarLogin([0]), (req, res) => {
    res.render('painel-pais');
});

app.get('/painel_terapeutas', verificarLogin([1]), (req, res) => {
    console.log(req.session.usuario);
    res.render('painel-terapeuta', { user: req.session.usuario });
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

app.get('/send_user', (req, res) => {
    res.send(req.session.usuario);
});

app.get('/send_paciente_dados', verificarLogin(), async (req, res) => {
    try {
        let user = req.session.usuario;
        const client = await db.connect();

        var result = {};

        if (user.tipo === 2) {
            result = await client.query(`SELECT * FROM teadmin.consulta ORDER BY data_consulta`);
        } if (user.tipo === 1) {
            result = await client.query(`SELECT * FROM teadmin.consulta WHERE id_profissional = $1 ORDER BY data_consulta`, [user.id_profissional]);
        } if (user.tipo === 0) {
            let id_pacienteRaw = await client.query('SELECT id_paciente FROM teadmin.paciente_responsavel WHERE id_responsavel = $1', [user.id_responsavel]);
            let id_paciente = id_pacienteRaw.rows[0].id_paciente;
            result = await client.query('SELECT * FROM teadmin.consulta WHERE id_paciente = $1', [id_paciente]);
        }

        let consultasRaw = result.rows;
        let consultasLista = [];
        let pacientes = [];

        if (consultasRaw.length > 0) {
            for (const i of consultasRaw) {
                let paciente = await client.query(`SELECT id_paciente, nome, sobrenome FROM teadmin.pacientes WHERE id_paciente = $1`, [i.id_paciente]);
                paciente = paciente.rows[0];

                if (!pacientes.some(p => p.id_paciente === paciente.id_paciente)) {
                    pacientes.push({ ...paciente });
                }

                paciente.id_consulta = i.id_consulta;
                paciente.id_status = i.id_status;
                paciente.hora_consulta = i.hora_consulta;
                paciente.data_consulta = i.data_consulta;
                consultasLista.push(paciente);
            }
        }

        let pacientes_dados = { pacientes: pacientes, consultasLista: consultasLista };
        console.log(pacientes_dados);
        client.release();

        res.send(pacientes_dados);
    } catch (error) {
        res.send(`Erro: ${error}`);
    }
});

// Retorna pacientes para o modal do calendário
// Terapeuta vê só seus pacientes, admin vê todos
app.get('/api/pacientes', verificarLogin([1, 2]), async (req, res) => {
    try {
        const client = await db.connect();
        let result;

        if (req.session.usuario.tipo === 1) {
            result = await client.query(`
                SELECT DISTINCT p.id_paciente, p.nome, p.sobrenome
                FROM teadmin.pacientes p
                JOIN teadmin.consulta c ON c.id_paciente = p.id_paciente
                WHERE c.id_profissional = $1
                ORDER BY p.nome
            `, [req.session.usuario.id_profissional]);
        } else {
            result = await client.query(`
                SELECT id_paciente, nome, sobrenome
                FROM teadmin.pacientes
                ORDER BY nome
            `);
        }

        client.release();
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Retorna consultas para o FullCalendar
// Terapeuta vê só as suas, admin vê todas
app.get('/api/agendamentos', verificarLogin([1, 2]), async (req, res) => {
    try {
        const client = await db.connect();
        let result;

        if (req.session.usuario.tipo === 1) {
            result = await client.query(`
                SELECT c.id_consulta, c.data_consulta, c.hora_consulta,
                       p.nome, p.sobrenome, c.id_paciente
                FROM teadmin.consulta c
                JOIN teadmin.pacientes p ON c.id_paciente = p.id_paciente
                WHERE c.id_profissional = $1
                ORDER BY c.data_consulta, c.hora_consulta
            `, [req.session.usuario.id_profissional]);
        } else {
            result = await client.query(`
                SELECT c.id_consulta, c.data_consulta, c.hora_consulta,
                       p.nome, p.sobrenome, c.id_paciente
                FROM teadmin.consulta c
                JOIN teadmin.pacientes p ON c.id_paciente = p.id_paciente
                ORDER BY c.data_consulta, c.hora_consulta
            `);
        }

        const eventos = result.rows.map(c => ({
            id: c.id_consulta,
            title: c.nome + ' ' + c.sobrenome,
            start: c.data_consulta.toISOString().split('T')[0] + 'T' + c.hora_consulta,
            extendedProps: {
                id_paciente: c.id_paciente
            }
        }));

        client.release();
        res.json(eventos);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

///////////////////////////////////////////
/////////////// ROTAS POST //////////////// 
///////////////////////////////////////////

app.post("/login_send", validac_login, async (req, res) => {
    res.redirect("/");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

// Cria novo agendamento
app.post('/api/agendamentos', verificarLogin([1, 2]), async (req, res) => {
    try {
        const { id_paciente, data, hora } = req.body;
        const id_profissional = req.session.usuario.id_profissional;
        const client = await db.connect();

        await client.query(`
            INSERT INTO teadmin.consulta 
            (id_paciente, id_profissional, id_recepcionista, id_status, data_consulta, hora_consulta)
            VALUES ($1, $2, 1, 1, $3, $4)
        `, [id_paciente, id_profissional, data, hora]);

        client.release();
        res.json({ sucesso: true });
    } catch (error) {
        console.log(error);
        res.json({ sucesso: false, erro: error.message });
    }
});

///////////////////////////////////////////
/////////////// ROTAS PUT //////////////// 
///////////////////////////////////////////

app.put('/atender_consulta', verificarLogin([1, 2]), async function (req, res) {
    try {
        let id_consulta = req.query.id_consulta;
        console.log(id_consulta);
        const client = await db.connect();
        await client.query('UPDATE teadmin.consulta SET id_status = 1 WHERE id_consulta = $1', [id_consulta]);
        client.release();
        res.send('Sucesso!');
    } catch (error) {
        console.log(error);
    }
});

///////////////////////////////////////////
////////////// ROTAS DELETE /////////////// 
///////////////////////////////////////////

// Exclui agendamento
app.delete('/api/agendamentos/:id', verificarLogin([1, 2]), async (req, res) => {
    try {
        const id_consulta = req.params.id;
        const client = await db.connect();

        await client.query(`
            DELETE FROM teadmin.consulta WHERE id_consulta = $1
        `, [id_consulta]);

        client.release();
        res.json({ sucesso: true });
    } catch (error) {
        console.log(error);
        res.json({ sucesso: false, erro: error.message });
    }
});

//////////////////////////////////////////

app.listen(port, () => {
    console.log(`Express rodando na em: http://localhost:${port}`);
});