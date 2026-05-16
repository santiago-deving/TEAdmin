const express = require('express');
const session = require("express-session");
// const pgSession = require("connect-pg-simple")(session);
var bodyParser = require('body-parser');
const path = require('path');

require("dotenv").config();

const app = express();
const db = require("./db");
const { verificarLogin, validac_login } = require("./middlewares/auth");
const { calcFreq } = require('./middlewares/dataFunctions');
const port = process.env.PORT || 3000 ;

const e = require('express');

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax'
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
    console.log(req.session.usuario);
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

app.get('/send_user', (req, res) => {
  res.send(req.session.usuario);
})

app.get('/send_paciente_dados', verificarLogin(),async (req, res) => {
    try {
        let user = req.session.usuario;
        const client = await db.connect();

        var result = {};

        if (user.tipo === 2) {
            result = await client.query(`SELECT * FROM teadmin.consulta ORDER BY data_consulta`);
        } if (user.tipo === 1) {
            result = await client.query(`SELECT * FROM teadmin.consulta where id_profissional = ${user.id_profissional} ORDER BY data_consulta`);
        } if (user.tipo === 0) {
            let id_pacienteRaw = await client.query('SELECT id_paciente FROM teadmin.paciente_responsavel WHERE id_responsavel = $1', [user.id_responsavel]);
            let id_paciente = id_pacienteRaw.rows[0].id_paciente;
            result = await client.query('SELECT * FROM teadmin.consulta where id_paciente = $1', [id_paciente]);
        }
        
        let consultasRaw = result.rows;
        let consultasLista = [];
        let pacientes = [];

        if (consultasRaw.length > 0) {
            for (const i of consultasRaw) {
                let paciente = await client.query(`SELECT id_paciente, nome, sobrenome FROM teadmin.pacientes where id_paciente = ${i.id_paciente}`);
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

        let pacientes_dados = {pacientes: pacientes, consultasLista: consultasLista}

        client.release();

        res.send(pacientes_dados);
    } catch (error) {
        res.send(`Erro: ${error}`)
    }
})

app.get('/send_paciente_dados/hoje', verificarLogin(), async (req, res) => {
    try {
        const user = req.session.usuario;
        const client = await db.connect();
        const id_profissional = user.id_profissional;

        let result;

        if (user.tipo === 2) {
            result = await client.query('SELECT * FROM teadmin.consultas_hoje()');
        } else if (user.tipo === 1) {
            result = await client.query('SELECT * FROM teadmin.consultas_hoje($1)', [user.id_profissional]);
        }

        let consultasRaw = result.rows;
        let consultasLista = [];
        let pacientes = [];

        if (consultasRaw.length > 0) {
            for (const i of consultasRaw) {
                if (!pacientes.some(p => p.id_paciente === i.id_paciente)) {
                    pacientes.push({
                        id_paciente: i.id_paciente,
                        nome: i.nome,
                        sobrenome: i.sobrenome
                    });
                }

                consultasLista.push({
                    id_paciente:    i.id_paciente,
                    nome:           i.nome,
                    sobrenome:      i.sobrenome,
                    id_consulta:    i.id_consulta,
                    id_status:      i.id_status,
                    hora_consulta:  i.hora_consulta,
                    data_consulta:  i.data_consulta
                });
            }
        }

        client.release();
        res.send({ "pacientes" : pacientes, "consultasLista" : consultasLista });
    } catch (error) {
        res.send(`Erro: ${error}`);
    }
});

// Adicionado: rota específica para dados do responsável logado
// Diferente da rota de terapeutas, não faz SELECT do usuário no banco
// pois o responsável já está na sessão via req.session.usuario
app.get('/send_dados_responsavel', verificarLogin([0]), async (req, res) => {
    const client = await db.connect();
    try {
        // Responsável vem direto da sessão, mesmo objeto retornado por /send_user
        const responsavel = req.session.usuario;

        // Busca o paciente vinculado ao responsável
        let pacienteRaw = await client.query(
            'SELECT id_paciente FROM teadmin.paciente_responsavel WHERE id_responsavel = $1',
            [responsavel.id_responsavel]
        );
        let id_paciente = pacienteRaw.rows[0].id_paciente;

        // Busca as consultas do paciente vinculado
        let consultasRaw = await client.query(
            'SELECT * FROM teadmin.consulta WHERE id_paciente = $1',
            [id_paciente]
        );

        // Monta consultasLista com nome e sobrenome do paciente
        let consultasLista = [];
        for (const c of consultasRaw.rows) {
            const paciente = await client.query(
                'SELECT id_paciente, nome, sobrenome FROM teadmin.pacientes WHERE id_paciente = $1',
                [c.id_paciente]
            );

            consultasLista.push({
                ...c,
                nome:      paciente.rows[0]?.nome,
                sobrenome: paciente.rows[0]?.sobrenome
            });
        }

        res.json({ responsavel, consultasLista });

    } catch (error) {
        res.send(`Erro: ${error}`);
    } finally {
        client.release();
    }
});

app.get('/ver_freq', verificarLogin(), async (req, res) => {
    try {
        console.log('QUERY:', req.query);

        const id_paciente = Number(req.query.id_paciente);

        const id_profissional = req.query.id_profissional
            ? Number(req.query.id_profissional)
            : null;

        console.log({
            id_paciente,
            id_profissional
        });

        const frequencia = await calcFreq(
            id_paciente,
            id_profissional,
            req
        );

        console.log('FREQ:', frequencia);

        return res.json({ frequencia });

    } catch (error) {
        console.error('ERRO VER_FREQ:', error);

        return res.status(500).json({
            erro: String(error)
        });
    }
});

app.get('/ver_freq/todos', verificarLogin(), async (req, res) => {
    try {
        const user = req.session.usuario;
        const tipo = parseInt(user.tipo);
        const client = await db.connect();

        let pacientes;
        if (tipo === 1) {
            pacientes = await client.query(
                'SELECT DISTINCT id_paciente FROM teadmin.consulta WHERE id_profissional = $1',
                [user.id_profissional]
            );
        } else if (tipo === 2) {
            pacientes = await client.query('SELECT DISTINCT id_paciente FROM teadmin.consulta');
        }

        const freqs = {};
        for (const p of pacientes.rows) {
            let result;
            if (tipo === 1) {
                result = await client.query('SELECT calcfreq($1, $2)', [p.id_paciente, user.id_profissional]);
            } else if (tipo === 2) {
                result = await client.query('SELECT calcfreq($1)', [p.id_paciente]);
            }
            freqs[String(p.id_paciente)] = result.rows[0].calcfreq;
        }

        client.release();
        res.send(freqs);
    } catch (error) {
        console.error('Erro /ver_freq/todos:', error);
        res.status(500).json({ erro: error.message });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
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

///////////////////////////////////////////
/////////////// ROTAS PUT //////////////// 
///////////////////////////////////////////

app.put('/atender_consulta', verificarLogin([1,2]), async function(req, res) {
    try {
        let id_consulta = req.query.id_consulta;
        console.log(id_consulta);
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