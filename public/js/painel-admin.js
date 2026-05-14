// ===== FUNÇÃO BASE DE FETCH =====
// Função genérica reutilizável para requisições GET ao backend
// Renomeada de profissionalData() para getData() seguindo o padrão do projeto
async function getData(route) {
    try {
        const response = await fetch(route);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(error.message);
    }
}

// ===== FUNÇÕES ESPECÍFICAS DE CADA ROTA =====
// Cada função representa uma rota do backend e documenta o que se espera receber

// Retorna os dados do usuário/admin logado
// Espera: { nome, totalPacientes, totalTerapeutas, totalSessoes, totalAguardando, terapeutas[], ocupacao[], aguardando[] }
async function sendUser() {
    return await getData('send_user');
}

// Retorna os dados dos pacientes vinculados
// Espera: { pacientes: [{ nome, ultimaPresenca }] }
async function sendPacienteDados() {
    return await getData('send_paciente_dados');
}

// ===== INIT =====
async function init() {
    // Alterado: chamadas diretas à rota substituídas pelas funções específicas
    const dadosAdmin = await sendUser();
    const pacientes_dados = await sendPacienteDados();

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
}

init();

// Alterado: salvarAgenda() movida para fora do init() pois é chamada
// diretamente pelo onclick no HTML e não depende dos dados do init
function salvarAgenda() {
    alert('Alterações salvas com sucesso!');
}