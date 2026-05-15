// ===== FUNÇÃO BASE DE FETCH =====
// async function getData(route) {
//     try {
//         const response = await fetch(route);
//         if (!response.ok) {
//             throw new Error(`Response status: ${response.status}`);
//         }
//         const result = await response.json();
//         return result;
//     } catch (error) {
//         console.error(error.message);
//     }
// }

async function getData(route) {
    try {
        const response = await fetch(route, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não é JSON:', text);
            throw new Error('Resposta inválida');
        }

        return await response.json();

    } catch (error) {
        console.error(error);
        return null;
    }
}

// ===== FUNÇÕES ESPECÍFICAS DE CADA ROTA =====
// Cada função representa uma rota do backend e documenta o que se espera receber

// Retorna os dados do usuário logado
// Espera: { nome }
async function sendUser() {
    return await getData('send_user');
}

// Retorna os dados dos pacientes e consultas do terapeuta
// Espera: { pacientes: [{ id_paciente, nome, sobrenome }], consultasLista: [{ nome, hora_consulta, id_consulta, id_status, data_consulta }] }
async function sendPacienteDados() {
    return await getData('send_paciente_dados');
}

async function sendPacienteDadosHoje() {
    return await getData('send_paciente_dados/hoje');
}

async function verFreq(id_paciente) {
    const data = await getData(`/ver_freq?id_paciente=${id_paciente}`);
    console.log(data);
    return data?.frequencia;
}

// Registra presença do paciente na consulta
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
    const pacientes_dados_hoje = await sendPacienteDadosHoje();

    const pacientes = pacientes_dados.pacientes;
    const consultasTerapeuta = pacientes_dados.consultasLista;
    const consultasTerapeutaHoje = pacientes_dados_hoje.consultasLista;

    document.getElementById('nome-terapeuta').textContent = dadosTerapeuta.nome;
    document.getElementById('nome-boas-vindas').textContent = dadosTerapeuta.nome;

    // Preenche horários
    const horarios = document.getElementById('horarios-lista');
    if (consultasTerapeutaHoje.length === 0) {
        horarios.innerHTML = '<p class="carregando">Nenhum horário disponível.</p>';
    } else {
        horarios.innerHTML = consultasTerapeutaHoje.map(h => `
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
            </div>
        `).join('');
    }

        // Preenche tabela de pacientes com frequência
    const tabela = document.getElementById('tabela-pacientes');
    if (pacientes.length === 0) {
        tabela.innerHTML = '<tr><td colspan="4" class="carregando">Nenhum paciente cadastrado ainda.</td></tr>';
    } else {
        tabela.innerHTML = '<tr><td colspan="4" class="carregando">Carregando frequências...</td></tr>';

        // Monta mapa de última presença por paciente (id_status === 2 = presença, conforme calcFreq do BD)
        const ultimaPresencaMap = {};
        for (const consulta of consultasTerapeuta) {
            if (consulta.id_status === 2) {
                const dataConsulta = new Date(consulta.data_consulta);
                const id = consulta.id_paciente;
                if (!ultimaPresencaMap[id] || dataConsulta > ultimaPresencaMap[id]) {
                    ultimaPresencaMap[id] = dataConsulta;
                }
            }
        }

        // Busca frequência de todos os pacientes em paralelo
        // const freqResultados = await Promise.all(
        //     pacientes.map(p =>
        //         verFreq(p.id_paciente)
        //             .then(freq => ({ id_paciente: p.id_paciente, freq }))
        //             .catch(() => ({ id_paciente: p.id_paciente, freq: null }))
        //     )
        // );
        const freqTodos = await getData('/ver_freq/todos');
        const freqMap = {};
        if (freqTodos) {
            for (const [id, freq] of Object.entries(freqTodos)) {
                freqMap[id] = parseFloat(freq);
            }
        }

        tabela.innerHTML = pacientes.map(p => {
            const freq = freqMap[p.id_paciente];
            const freqValida = freq !== null && !isNaN(freq);
            const freqDisplay = freqValida ? freq.toFixed(2) : '—';

            const cor = !freqValida ? '#999'
                : freq >= 90 ? 'var(--verde)'
                : freq >= 70 ? '#f9a825'
                : 'var(--vermelho)';

            const badge = !freqValida ? 'badge-cinza'
                : freq >= 90 ? 'badge-verde'
                : freq >= 70 ? 'badge-amarelo'
                : 'badge-vermelho';

            const statusLabel = !freqValida ? 'Sem dados'
                : freq >= 90 ? 'Regular'
                : freq >= 70 ? 'Atenção'
                : 'Irregular';

            const ultimaPresencaDate = ultimaPresencaMap[p.id_paciente];
            const ultimaPresencaDisplay = ultimaPresencaDate
                ? ultimaPresencaDate.toLocaleDateString('pt-BR')
                : 'Sem presença';

            return `
                <tr>
                    <td>${p.nome} ${p.sobrenome}</td>
                    <td>
                        <span class="barra-mini-container">
                            <span class="barra-mini" style="width:${freqValida ? freq : 0}%; background-color:${cor};"></span>
                        </span>
                        ${freqDisplay}%
                    </td>
                    <td>${ultimaPresencaDisplay}</td>
                    <td><span class="badge ${badge}">${statusLabel}</span></td>
                </tr>
            `;
        }).join('');
    }

    // Event listeners dos botões de presença e ausência
    const btnsPresente = document.getElementsByClassName('btn-presente');
    for (const btn of btnsPresente) {
        btn.addEventListener('click', async function () {
            const resultado = await atenderConsulta(this.dataset.id);
            console.log(resultado);
        });
    }

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