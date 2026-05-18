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

app.get("/calendario", verificarLogin(), (req, res) => {
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
})

app.get('/send_paciente_dados', verificarLogin(),async (req, res) => {
    const client = await db.connect();
    try {
        let user = req.session.usuario;
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
                paciente.id_profissional = i.id_profissional;
                paciente.hora_consulta = i.hora_consulta;
                paciente.data_consulta = i.data_consulta;
                consultasLista.push(paciente);
            }
        }

        let pacientes_dados = {pacientes: pacientes, consultasLista: consultasLista}

        res.send(pacientes_dados);
    } catch (error) {
        res.send(`Erro: ${error}`)
    } finally {
        client.release();
    }
})

app.get('/send_paciente_dados/todos', verificarLogin([2]), async (req,res)=>{
    const client = await db.connect();
    try {
        let pacientesRaw = await client.query('select * from pacientes');
        pacientesRaw = pacientesRaw.rows;
        let consultasRaw = await client.query('select * from consulta');
        consultasRaw = consultasRaw.rows;

        let pacientes = pacientesRaw;

        res.json({"pacientes" : pacientes});
    } catch(error) {
        res.json(error);
    } finally {
        client.release()
    }
})

app.get('/send_paciente_dados/hoje', verificarLogin(), async (req, res) => {
    const client = await db.connect();
    try {
        const user = req.session.usuario;
        const id_profissional = user.id_profissional;

        let result;

        if (user.tipo === 2) {
            result = await client.query('SELECT * FROM teadmin.consultas_hoje()');
        } else if (user.tipo === 1) {
            result = await client.query('SELECT * FROM teadmin.consultas_hoje($1::bigint)', [parseInt(user.id_profissional)]);
        } else if (user.tipo === 0) {
            let id_paciente = await client.query('SELECT id_paciente from teadmin.paciente_responsavel WHERE id_responsavel=$1',[user.id_responsavel]);
            id_paciente = id_paciente.rows[0].id_paciente;
            console.log(id_paciente);
            result = await client.query('SELECT * FROM teadmin.consultas_hoje_pac($1)', [id_paciente]);
            if (result.rows.length <= 0) {
                result = {"rows" : []};
            }
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
        
        res.json({ "pacientes" : pacientes, "consultasLista" : consultasLista });
    } catch (error) {
        res.send(`Erro: ${error}`);
    } finally {
        client.release();
    }
});

app.get('/send_dados_terapeutas', verificarLogin(),async (req, res) => {
    const client = await db.connect();
    try {
        let terapeutas = await client.query('SELECT * FROM profissional');
        terapeutas = terapeutas.rows;

        let consultasLista = [];

        for (const terapeuta of terapeutas) {
            const consultas = await client.query(
                'SELECT * FROM consulta WHERE id_profissional = $1',
                [terapeuta.id_profissional]
            );

            const consultasComNome = [];
            for (const c of consultas.rows) {
                const paciente = await client.query(
                    'SELECT id_paciente, nome, sobrenome FROM teadmin.pacientes WHERE id_paciente = $1',
                    [c.id_paciente]
                );

                consultasComNome.push({
                    ...c,
                    nome:      paciente.rows[0]?.nome,
                    sobrenome: paciente.rows[0]?.sobrenome
                });
            }

            consultasLista = consultasComNome;
        }

        res.json({ terapeutas, consultasLista });

    } catch (error) {
        res.send(`Erro: ${error}`);
    } finally {
        client.release();
    }
});

app.get('/send_dados_deficiencias', verificarLogin([2]), async (req,res)=>{
    const client = await db.connect();
    try {
        let deficiencias = await client.query('select * from teadmin.paciente_deficiencia')
        deficiencias = deficiencias.rows;
        console.log(deficiencias);
        res.json(deficiencias);
    } catch (error) {
        res.json(error);
    } finally {
        client.release()
    }
});

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

app.get('/send_freq_responsavel', verificarLogin([0]), async (req, res) => {
    const client = await db.connect();
    try {
        const user = req.session.usuario;

        // Pega o id_paciente vinculado ao responsável
        const pacienteRaw = await client.query(
            'SELECT id_paciente FROM teadmin.paciente_responsavel WHERE id_responsavel = $1',
            [user.id_responsavel]
        );

        if (pacienteRaw.rows.length === 0) {
            return res.json([]);
        }

        const id_paciente = pacienteRaw.rows[0].id_paciente;

        // Pega todos os profissionais que atenderam esse paciente
        const profissionaisRaw = await client.query(
            `SELECT DISTINCT c.id_profissional, p.nome, p.especialidade
             FROM teadmin.consulta c
             JOIN teadmin.profissional p ON p.id_profissional = c.id_profissional
             WHERE c.id_paciente = $1`,
            [id_paciente]
        );

        const resultado = [];

        for (const prof of profissionaisRaw.rows) {
            // Frequência via função do BD já existente
            const freqRaw = await client.query(
                'SELECT teadmin.calcfreq($1, $2)',
                [id_paciente, prof.id_profissional]
            );

            const row = freqRaw.rows[0];
            const freq = parseFloat(row[Object.keys(row)[0]]) || 0;

            resultado.push({
                id_profissional: prof.id_profissional,
                nome: prof.nome,
                especialidade: prof.especialidade,
                frequencia: freq
            });
        }

        res.json(resultado);
    } catch (error) {
        console.error('Erro /send_freq_responsavel:', error);
        res.status(500).json({ erro: error.message });
    } finally {
        client.release();
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

app.post("/cadastro/responsavel", verificarLogin([2]), async (req, res) => {
    const client = await db.connect();
    try {
        const novo = req.body;
        console.log(novo);

        const result = await client.query(
            "INSERT INTO teadmin.responsavel (nome, sobrenome, data_nascimento, sexo, cpf, email, senha) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_responsavel",
            [novo.nome, novo.sobrenome, novo.data_nascimento, novo.sexo, novo.cpf, novo.email, novo.senha]
        );

        const idResponsavel = result.rows[0].id_responsavel;

        await client.query(
            "INSERT INTO teadmin.paciente_responsavel(id_paciente, id_responsavel, grau_parentesco, responsavel_principal) VALUES ($1,$2,$3,$4)",
            [novo.id_paciente, idResponsavel, novo.parentesco, true]
        );

        res.json({ mensagem: 'Responsável cadastrado com sucesso!' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ mensagem: error.message });
    } finally {
        client.release();
    }
});

app.post("/cadastro/paciente", verificarLogin([2]), async (req, res) => {
    const client = await db.connect();
    try {
        let novoPac = req.body;
        await client.query(
            "INSERT INTO teadmin.pacientes (nome, sobrenome, data_nascimento, sexo, cpf) VALUES($1,$2,$3,$4,$5)",
            [novoPac.nome, novoPac.sobrenome, novoPac.data_nascimento, novoPac.sexo, novoPac.cpf]
        );
        res.json({ mensagem: 'Paciente cadastrado com sucesso!' }); // <- faltava
    } catch (error) {
        res.status(500).json({ mensagem: error.message });
    } finally {
        client.release();
    }
});

app.post('/enviar_novo_agendamento', verificarLogin([1, 2]), async (req, res) => {
    const client = await db.connect();
    try {
        const usuario = req.session.usuario;
        const novaConsulta = req.body;

        if (usuario.tipo === 2) {
            await client.query(
                'INSERT INTO teadmin.consulta (id_paciente, id_profissional, id_recepcionista, id_status, data_consulta, hora_consulta) VALUES ($1,$2,$3,$4,$5,$6)',
                [novaConsulta.id_paciente, novaConsulta.id_profissional, 1, 1, novaConsulta.data_consulta, novaConsulta.hora_consulta]
            );
        } else if (usuario.tipo === 1) {
            await client.query(
                'INSERT INTO teadmin.consulta (id_paciente, id_profissional, id_recepcionista, id_status, data_consulta, hora_consulta) VALUES ($1,$2,$3,$4,$5,$6)',
                [novaConsulta.id_paciente, usuario.id_profissional, 1, 1, novaConsulta.data_consulta, novaConsulta.hora_consulta]
            );
        } else {
            return res.status(403).json({ mensagem: 'Usuário não autorizado!' });
        }

        res.json({ mensagem: 'Consulta agendada com sucesso!' });
    } catch (error) {
        res.status(500).json({ mensagem: error.message });
        console.log(error);
    } finally {
        client.release();
    }
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

app.put('/enviar_agendamento_editado', verificarLogin([1, 2]), async (req, res) => {
    const client = await db.connect();
    try {
        const usuario = req.session.usuario;
        const { id_consulta, id_paciente, id_profissional, data_consulta, hora_consulta } = req.body;

        if (usuario.tipo === 2) {
            await client.query(
                'UPDATE teadmin.consulta SET id_paciente=$1, id_profissional=$2, data_consulta=$3, hora_consulta=$4 WHERE id_consulta=$5',
                [id_paciente, id_profissional, data_consulta, hora_consulta, id_consulta]
            );
        } else if (usuario.tipo === 1) {
            await client.query(
                'UPDATE teadmin.consulta SET data_consulta=$1, hora_consulta=$2 WHERE id_consulta=$3 AND id_profissional=$4',
                [data_consulta, hora_consulta, id_consulta, usuario.id_profissional]
            );
        } else {
            return res.status(403).json({ mensagem: 'Usuário não autorizado!' });
        }

        res.json({ mensagem: 'Consulta atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ mensagem: error.message });
    } finally {
        client.release();
    }
});

//////////////////////////////////////////

app.listen(port, ()=>{
    console.log(`Express rodando na em: http://localhost:${port}`);
});