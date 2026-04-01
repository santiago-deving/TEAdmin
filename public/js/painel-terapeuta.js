// Futuramente esses dados virão do backend após autenticação

const dadosTerapeuta = {
    nome: "Terapeuta",      // virá do backend
    pacientes: [
        // { nome: "Paciente 1", frequencia: 98, ultimaPresenca: "Ontem", status: "Excelente" },
        // { nome: "Paciente 2", frequencia: 85, ultimaPresenca: "3 dias atrás", status: "Atenção" },
        // { nome: "Paciente 3", frequencia: 60, ultimaPresenca: "1 semana atrás", status: "Alerta" },
    ],
    horarios: [
        // { hora: "10:00 - 11:00", status: "Livre" },
        // { hora: "14:00 - 15:00", status: "Livre" },
    ]
};

// Preenche nome
document.getElementById('nome-terapeuta').textContent = dadosTerapeuta.nome;
document.getElementById('nome-boas-vindas').textContent = dadosTerapeuta.nome;

// Preenche tabela de pacientes
const tabela = document.getElementById('tabela-pacientes');
if (dadosTerapeuta.pacientes.length === 0) {
    tabela.innerHTML = '<tr><td colspan="4" class="carregando">Nenhum paciente cadastrado ainda.</td></tr>';
} else {
    tabela.innerHTML = dadosTerapeuta.pacientes.map(p => {
        const cor = p.frequencia >= 90 ? 'var(--verde)' : p.frequencia >= 70 ? '#f9a825' : 'var(--vermelho)';
        const badge = p.frequencia >= 90 ? 'badge-verde' : p.frequencia >= 70 ? 'badge-amarelo' : 'badge-vermelho';
        return `
            <tr>
                <td>${p.nome}</td>
                <td>
                    <span class="barra-mini-container">
                        <span class="barra-mini" style="width:${p.frequencia}%; background-color:${cor};"></span>
                    </span>
                    ${p.frequencia}%
                </td>
                <td>${p.ultimaPresenca}</td>
                <td><span class="badge ${badge}">${p.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Preenche horários
const horarios = document.getElementById('horarios-lista');
if (dadosTerapeuta.horarios.length === 0) {
    horarios.innerHTML = '<p class="carregando">Nenhum horário disponível.</p>';
} else {
    horarios.innerHTML = dadosTerapeuta.horarios.map(h => `
        <div class="horario-item">
            <span class="horario-hora">${h.hora}</span>
            <button class="btn-agendar">+ Agendar</button>
        </div>
    `).join('');
}

// Preenche pacientes atuais
const pacientesGrid = document.getElementById('pacientes-grid');
if (dadosTerapeuta.pacientes.length === 0) {
    pacientesGrid.innerHTML = '<p class="carregando">Nenhum paciente cadastrado ainda.</p>';
} else {
    pacientesGrid.innerHTML = dadosTerapeuta.pacientes.map(p => `
        <div class="paciente-card">
            <div class="paciente-avatar">👦</div>
            <div class="paciente-nome">${p.nome}</div>
            <div class="paciente-info">${p.ultimaPresenca}</div>
        </div>
    `).join('');
}