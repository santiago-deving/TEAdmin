// Futuramente virá do backend
const dadosAdmin = {
    nome: "Administrador",
    totalPacientes: 0,
    totalTerapeutas: 0,
    totalSessoes: 0,
    totalAguardando: 0,
    terapeutas: [],
    ocupacao: [],
    aguardando: []
};

document.getElementById('nome-admin').textContent = dadosAdmin.nome;
document.getElementById('nome-boas-vindas').textContent = dadosAdmin.nome;
document.getElementById('total-pacientes').textContent = dadosAdmin.totalPacientes;
document.getElementById('total-terapeutas').textContent = dadosAdmin.totalTerapeutas;
document.getElementById('total-sessoes').textContent = dadosAdmin.totalSessoes;
document.getElementById('total-aguardando').textContent = dadosAdmin.totalAguardando;

// Preenche select de terapeutas
const select = document.getElementById('select-terapeuta');
dadosAdmin.terapeutas.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.nome;
    select.appendChild(opt);
});

// Ocupação
const ocupacaoLista = document.getElementById('ocupacao-lista');
if (dadosAdmin.ocupacao.length === 0) {
    ocupacaoLista.innerHTML = '<p class="carregando">Nenhum dado disponível.</p>';
} else {
    ocupacaoLista.innerHTML = dadosAdmin.ocupacao.map(t => {
        const cor = t.pct >= 85 ? '#E76F51' : t.pct >= 60 ? '#F4A261' : '#4CAF50';
        return `
            <div class="ocupacao-item">
                <span class="ocupacao-nome">${t.nome}</span>
                <div class="ocupacao-barra-bg">
                    <div class="ocupacao-barra" style="width:${t.pct}%; background:${cor};"></div>
                </div>
                <span class="ocupacao-pct">${t.pct}%</span>
            </div>
        `;
    }).join('');
}

// Aguardando agendamento
const aguardandoLista = document.getElementById('aguardando-lista');
if (dadosAdmin.aguardando.length === 0) {
    aguardandoLista.innerHTML = '<p class="carregando">Nenhum paciente aguardando.</p>';
} else {
    aguardandoLista.innerHTML = dadosAdmin.aguardando.map(p => `
        <div class="aguardando-item">
            <span class="aguardando-nome">${p.nome}</span>
            <button class="btn-agendar-pac">Agendar</button>
        </div>
    `).join('');
}

function salvarAgenda() {
    alert('Alterações salvas com sucesso!');
}