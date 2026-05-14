const db = require('../db');

function verificarLogin(userType) {
  return function(req, res, next) {
    if (req.session && req.session.usuario) {
      let user = req.session.usuario;
      if (userType === undefined || userType.includes(user.tipo)) {
        return next();
      } else {
        return res.redirect('/');
      }
    }
    return res.redirect("/login");
  };
}

async function validac_login(req, res, next) {
  let email = req.body.email;
  let senha = req.body.senha;

  const client = await db.connect();

  try {
    let user;

    user = await client.query(
      `SELECT id_usuario, login AS email, senha, 2 AS tipo
       FROM teadmin.usuario 
       WHERE login = $1 AND senha = $2`,
      [email, senha]
    );

    if (user.rows.length === 0) {
      user = await client.query(
        `SELECT id_responsavel, nome, sobrenome, email, senha, 0 AS tipo
         FROM teadmin.responsavel 
         WHERE email = $1 AND senha = $2`,
        [email, senha]
      );
    }

    if (user.rows.length === 0) {
      user = await client.query(
        `SELECT id_profissional, nome, sobrenome, email, senha, 1 AS tipo
         FROM teadmin.profissional 
         WHERE email = $1 AND senha = $2`,
        [email, senha]
      );
    }

    if (user.rows.length === 0) {
      user = await client.query(
        `SELECT id_recepcionista, nome, sobrenome, email, senha, 2 AS tipo
         FROM teadmin.recepcionista 
         WHERE email = $1 AND senha = $2`,
        [email, senha]
      );
    }

    if (user.rows.length === 0) {
      return res.send('credenciais inválidas!');
    }

    user = user.rows[0];

    console.log('USUARIO LOGADO:', user);

    req.session.usuario = user;

    return next();
  } catch (error) {
    res.send(`Erro: ${error}`);
  } finally {
    client.release();
  }
}

module.exports = { verificarLogin, validac_login };