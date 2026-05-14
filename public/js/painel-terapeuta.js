// ===== FUNÇÃO BASE DE FETCH =====
// Função genérica reutilizável para requisições GET ao backend
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

// Retorna os dados do usuário logado
// Espera: { nome, pacientes[] }
async function sendUser() {
    return await getData('send_user');
}

// Retorna os dados dos pacientes e consultas do terapeuta
// Espera: { pacientes: [{ nome, ultimaPresenca }], consultasLista: [{ nome, hora_consulta, id_consulta }] }
async function sendPacienteDados() {
    return await getData('send_paciente_dados');
}

async function verFreqTodos() {
    const result = await getData('/ver_freq/todos');
    console.log('verFreqTodos result:', result); // ver o que volta
    if (!result) return {};
    const freqMap = {};
    for (const [id, freq] of Object.entries(result)) {
        freqMap[String(id)] = freq !== null ? parseFloat(freq) : null;
    }
    return freqMap;
}

=======
>>>>>>> parent of 9955d4e (painel terapeuta fim)
// Registra presença do paciente na consulta
// Espera: { success: true } ou status de erro
async function atenderConsulta(id_consulta) {
    try {
        const response = await fetch(`/atender_consulta?id_consulta=${id_consulta}`, { method: 'POST' });
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error.message);
    }
}

// Registra ausência do paciente na consulta
// Espera: { success: true } ou status de erro
// Adicionado: o botão de ausência existia no HTML mas não tinha função de fetch correspondente
async function ausenciaConsulta(id_consulta) {
    try {
        const response = await fetch(`/ausencia_consulta?id_consulta=${id_consulta}`, { method: 'POST' });
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error.message);
    }
}

// ===== INIT =====
async function init() {
    // Alterado: chamadas diretas à rota substituídas pelas funções específicas
    const dadosTerapeuta = await sendUser();
    const pacientes_dados = await sendPacienteDados();

    const pacientes = pacientes_dados.pacientes;
    const consultasTerapeuta = pacientes_dados.consultasLista;

    document.getElementById('nome-terapeuta').textContent = dadosTerapeuta.nome;
    document.getElementById('nome-boas-vindas').textContent = dadosTerapeuta.nome;

    // Preenche horários
    const horarios = document.getElementById('horarios-lista');
    if (consultasTerapeuta.length === 0) {
        horarios.innerHTML = '<p class="carregando">Nenhum horário disponível.</p>';
    } else {
        horarios.innerHTML = consultasTerapeuta.map(h => `
            <div class="horario-item">
                <span class="horario-hora">${h.nome} - ${h.hora_consulta}</span>
                <button class="btn-presente" data-id="${h.id_consulta}">&#9989</button>
                <button class="btn-ausente" data-id="${h.id_consulta}">&#10060</button>
            </div>
        `).join('');
    }

    // Preenche pacientes atuais
    const pacientesGrid = document.getElementById('pacientes-grid');
    if (pacientes.length === 0) {
        pacientesGrid.innerHTML = '<p class="carregando">Nenhum paciente cadastrado ainda.</p>';
    } else {
        pacientesGrid.innerHTML = pacientes.map(p => `
            <div class="paciente-card">
                <div class="paciente-avatar">👦</div>
                <div class="paciente-nome">${p.nome}</div>
                <div class="paciente-info">${p.ultimaPresenca}</div>
            </div>
        `).join('');
    }

    // Alterado: event listener agora usa atenderConsulta() no lugar do fetch() avulso
    // Alterado: id_consulta extraído via data-id em vez de value="/rota?id=..."
    const btnsPresente = document.getElementsByClassName('btn-presente');
    for (const btn of btnsPresente) {
        btn.addEventListener('click', async function () {
            const resultado = await atenderConsulta(this.dataset.id);
            console.log(resultado);
        });
    }

    // Adicionado: event listener do botão ausente que não existia no código original
    const btnsAusente = document.getElementsByClassName('btn-ausente');
    for (const btn of btnsAusente) {
        btn.addEventListener('click', async function () {
            const resultado = await ausenciaConsulta(this.dataset.id);
            console.log(resultado);
        });
    }
}

init();

// ===== SIDEBAR =====
// Removido: console.log('clicked') que era debug esquecido no closeBtn
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu_btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeBtn');

    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('aberto');
        overlay.classList.toggle('ativo');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.toggle('aberto');
        overlay.classList.toggle('ativo');
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.toggle('aberto');
        overlay.classList.toggle('ativo');
    });
});