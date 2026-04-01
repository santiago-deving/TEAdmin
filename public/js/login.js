function fazerLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert('Preencha e-mail e senha!');
        return;
    }

    // Por enquanto redireciona conforme o e-mail
    // Futuramente virá do backend
    if (email.includes('admin')) {
        window.location.href = '/pages/painel-admin.html';
    } else if (email.includes('terapeuta')) {
        window.location.href = '/pages/painel-terapeuta.html';
    } else {
        window.location.href = '/pages/painel-pais.html';
    }
}