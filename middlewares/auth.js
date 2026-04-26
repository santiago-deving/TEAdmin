const db = require('../db');

function verificarLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect("/login");
}

async function validac_login(req, res, next) {
  let email = req.body.email;
  let senha = req.body.senha;

  const client = await db.connect();

  try {
    let user
    
    user = await client.query('SELECT * FROM teadmin.responsavel WHERE email = $1 AND senha = $2', [email, senha]);

    if (user.rows.length === 0) {
      console.log('n responsavel');
      user = await client.query('SELECT * FROM teadmin.profissional WHERE email = $1 AND senha = $2', [email, senha]);
    }

    if (user.rows.length === 0) {
      console.log('n profissional');
      user = await client.query('SELECT * FROM teadmin.adm WHERE email = $1 AND senha = $2', [email, senha]);
    }

    if (user.rows.length === 0) {
      console.log('n sei n man');
    }

    user = user.rows[0];

    console.log(user);
    
    req.session.usuario = user;  // salva o usuario no cookie
    return next();
  } catch (e) {
    res.send(`Erro: ${e}`);
  } finally {
    client.release();
  }
}

module.exports = { verificarLogin, validac_login };