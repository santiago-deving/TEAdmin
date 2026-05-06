// const { use } = require('react');
const db = require('../db');

function verificarLogin(userType) {
  return function(req, res, next) {
    if (req.session && req.session.usuario) {
      let user = req.session.usuario;
      if (userType === undefined || userType === user.tipo) {
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
    let user
    
    // responsavel = 0
    // profissional = 1
    // administrativo = 2
    user = await client.query('SELECT *, 0 AS tipo FROM teadmin.responsavel WHERE email = $1 AND senha = $2', [email, senha]);

    if (user.rows.length === 0) {
      user = await client.query('SELECT *, 1 AS tipo FROM teadmin.profissional WHERE email = $1 AND senha = $2', [email, senha]);
    }

    if (user.rows.length === 0) {
      user = await client.query('SELECT *, 2 AS tipo FROM teadmin.recepcionista WHERE email = $1 AND senha = $2', [email, senha]);
    }

    if (user.rows.length === 0) {
      return res.send('credenciais inválidas!');
    }

    user = user.rows[0];

    req.session.usuario = user;  // salva o usuario no cookie

    return next();
  } catch (error) {
    res.send(`Erro: ${error}`);
  } finally {
    client.release();
  }
}

module.exports = { verificarLogin, validac_login };