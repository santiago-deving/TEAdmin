function verificarLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect("/login");
}

module.exports = verificarLogin;