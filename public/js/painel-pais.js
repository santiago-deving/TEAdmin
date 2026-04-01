// Futuramente esses dados virão do backend após autenticação
// Por enquanto simulei o que a API retornará

const dadosUsuario = {
    nome: "Usuário",         // virá do backend
    filhoNome: "seu filho(a)", // virá do backend
    terapeutas: [
        // virá do backend
        // { nome: "Terapeuta 1", especialidade: "Psicóloga", presenca: 100 },
        // { nome: "Terapeuta 2", especialidade: "Fonoaudiólogo", presenca: 80 },
    ]
};

// Preenche o nome do usuário na tela
document.getElementById('nome-usuario').textContent = dadosUsuario.nome;
document.getElementById('nome-boas-vindas').textContent = dadosUsuario.nome;

// Preenche a lista de frequência
const lista = document.getElementById('frequencia-lista');

if (dadosUsuario.terapeutas.length === 0) {
    lista.innerHTML = '<p class="carregando">Nenhum dado disponível ainda.</p>';
} else {
    lista.innerHTML = dadosUsuario.terapeutas.map(t => `
        <div class="frequencia-card">
            <p class="terapeuta-nome">${t.nome} (${t.especialidade})</p>
            <div class="barra-container">
                <div class="barra" style="width: ${t.presenca}%; background-color: ${t.presenca === 100 ? 'var(--verde)' : 'var(--azul)'};">
                    ${t.presenca}%
                </div>
            </div>
        </div>
    `).join('');
}