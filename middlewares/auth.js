function verificarLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  res.status(401).json({ error: 'Não autorizado' });
  // ou redireciona: res.redirect('/login')
}

module.exports = verificarLogin;