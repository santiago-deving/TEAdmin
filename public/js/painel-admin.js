// ===== FUNÇÃO BASE DE FETCH =====
async function getData(route) {
    try {
        const response = await fetch(route);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error.message);
    }
}

// ===== FUNÇÕES ESPECÍFICAS DE CADA ROTA =====
async function sendUser() {
    return await getData('send_user');
}
async function sendPacienteDados() {
    return await getData('send_paciente_dados');
}
async function sendTerapeutasDados() {
    return await getData('send_dados_terapeutas');
}

// ===== INIT =====
async function init() {
    const dadosAdmin      = await sendUser();
    const dadosPaciente   = await sendPacienteDados();
    const dadosTerapeutas = await sendTerapeutasDados(); // objeto { terapeutas, consultasLista }

    if (!dadosAdmin) {
        console.error('Erro ao carregar dados do admin');
        return;
    }

    // ----- Dados do admin logado -----
    document.getElementById('nome-admin').textContent       = dadosAdmin.nome;
    document.getElementById('nome-boas-vindas').textContent = dadosAdmin.nome;

    // ----- Totais calculados -----
    const pacientes   = dadosPaciente?.pacientes      ?? [];
    const consultas   = dadosPaciente?.consultasLista  ?? [];
    const terapeutas  = dadosTerapeutas?.terapeutas    ?? []; // <- array correto
    const consultasTerapeutas = dadosTerapeutas?.consultasLista ?? [];

    const aguardando = consultas.filter(c => c.id_status === 1);
    const realizadas = consultas.filter(c => c.id_status === 2);

    document.getElementById('total-pacientes').textContent  = pacientes.length;
    document.getElementById('total-terapeutas').textContent = terapeutas.length;
    document.getElementById('total-sessoes').textContent    = realizadas.length;
    document.getElementById('total-aguardando').textContent = aguardando.length;

    // ----- Select de terapeutas -----
    const select = document.getElementById('select-terapeuta');
    if (terapeutas.length > 0) {
        terapeutas.forEach(t => {
            const opt = document.createElement('option');
            opt.value       = t.id_profissional;
            opt.textContent = t.nome;
            select.appendChild(opt);
        });
    }

    // ----- Ocupação por terapeuta -----
    const ocupacaoLista = document.getElementById('ocupacao-lista');
    if (terapeutas.length === 0) {
        ocupacaoLista.innerHTML = '<p class="carregando">Nenhum dado disponível.</p>';
    } else {
        const maxConsultas = Math.max(...terapeutas.map(t =>
            consultasTerapeutas.filter(c => c.id_profissional === t.id_profissional).length
        ), 1);

        ocupacaoLista.innerHTML = terapeutas.map(t => {
            const qtd = consultasTerapeutas.filter(c => c.id_profissional === t.id_profissional).length;
            const pct = Math.round((qtd / maxConsultas) * 100);
            const cor = pct >= 85 ? '#E76F51' : pct >= 60 ? '#F4A261' : '#4CAF50';
            return `
                <div class="ocupacao-item">
                    <span class="ocupacao-nome">${t.nome}</span>
                    <div class="ocupacao-barra-bg">
                        <div class="ocupacao-barra" style="width:${pct}%; background:${cor};"></div>
                    </div>
                    <span class="ocupacao-pct">${qtd} consultas</span>
                </div>
            `;
        }).join('');
    }

    // ----- Aguardando agendamento -----
    const aguardandoLista = document.getElementById('aguardando-lista');
    if (aguardando.length === 0) {
        aguardandoLista.innerHTML = '<p class="carregando">Nenhum paciente aguardando.</p>';
    } else {
        aguardandoLista.innerHTML = aguardando.map(p => `
            <div class="aguardando-item">
                <span class="aguardando-nome">${p.nome} ${p.sobrenome}</span>
                <span class="aguardando-data">${new Date(p.data_consulta).toLocaleDateString('pt-BR')} às ${p.hora_consulta.slice(0,5)}</span>
                <button class="btn-agendar-pac" data-id="${p.id_paciente}">Agendar</button>
            </div>
        `).join('');
    }
}

init();

function salvarAgenda() {
    alert('Alterações salvas com sucesso!');
}