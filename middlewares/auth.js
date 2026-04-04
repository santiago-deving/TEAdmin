function verificarLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect("/login");
}

async function validac_login(req, res, next) {
  let email = req.body.email;
  let senha = req.body.senha;

  console.log(JSON.stringify(req.body));
  return next();
}

module.exports = { verificarLogin, validac_login };