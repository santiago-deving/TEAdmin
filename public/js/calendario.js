// Futuramente as sessões virão do backend

async function userData(route) {
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

async function init() {

const dadosUsuario = await userData('/send_user');
const pacientes_dados = await userData('/send_paciente_dados');

// transforma no formato que o calendário espera: { "2026-05-12": [{...}] }
const sessoes = {};
for (const c of pacientes_dados.consultasLista) {
    const chave = c.data_consulta.split('T')[0]; // pega só "2026-05-12"
    if (!sessoes[chave]) sessoes[chave] = [];
    sessoes[chave].push({
        hora: c.hora_consulta,
        nome: c.nome + ' ' + c.sobrenome,
        tipo: 'Consulta',
        status: 'agendado'
    });
}

const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

let dataAtual = new Date();
let mesSelecionado = dataAtual.getMonth();
let anoSelecionado = dataAtual.getFullYear();
let diaSelecionado = null;

function renderizarCalendario() {
    document.getElementById('mes-ano').textContent =
        `${meses[mesSelecionado]} ${anoSelecionado}`;

    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    const primeiroDia = new Date(anoSelecionado, mesSelecionado, 1).getDay();
    const totalDias = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
    const hoje = new Date();

    for (let i = 0; i < primeiroDia; i++) {
        const vazio = document.createElement('div');
        vazio.classList.add('cal-dia', 'vazio');
        grid.appendChild(vazio);
    }

    for (let d = 1; d <= totalDias; d++) {
        const div = document.createElement('div');
        div.classList.add('cal-dia');
        div.textContent = d;

        const chave = `${anoSelecionado}-${String(mesSelecionado+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

        if (
            d === hoje.getDate() &&
            mesSelecionado === hoje.getMonth() &&
            anoSelecionado === hoje.getFullYear()
        ) {
            div.classList.add('hoje');
        }

        if (sessoes[chave]) {
            div.classList.add('tem-sessao');
        }

        if (diaSelecionado === chave) {
            div.classList.add('selecionado');
        }

        div.addEventListener('click', () => selecionarDia(chave, d));
        grid.appendChild(div);
    }
}

function selecionarDia(chave, dia) {
    diaSelecionado = chave;
    renderizarCalendario();

    document.getElementById('data-selecionada').textContent =
        `${dia} de ${meses[mesSelecionado]} de ${anoSelecionado}`;

    const agendaDiv = document.getElementById('agenda-dia');
    const sessoesNoDia = sessoes[chave];

    if (!sessoesNoDia || sessoesNoDia.length === 0) {
        agendaDiv.innerHTML = '<p class="carregando">Nenhuma sessão agendada para este dia.</p>';
        return;
    }

    agendaDiv.innerHTML = sessoesNoDia.map((s, i) => `
        <div class="sessao-item">
            <span class="sessao-hora">${s.hora}</span>
            <div class="sessao-info">
                <div class="sessao-nome">${s.nome}</div>
                <div class="sessao-tipo">${s.tipo}</div>
            </div>
            <span class="sessao-status status-${s.status}">
                ${s.status === 'agendado' ? 'Agendado' : s.status === 'concluido' ? 'Concluído' : 'Falta'}
            </span>
        </div>
    `).join('');
}

function mudarMes(direcao) {
    mesSelecionado += direcao;
    if (mesSelecionado < 0) { mesSelecionado = 11; anoSelecionado--; }
    if (mesSelecionado > 11) { mesSelecionado = 0; anoSelecionado++; }
    diaSelecionado = null;
    document.getElementById('agenda-dia').innerHTML =
        '<p class="carregando">Selecione um dia no calendário.</p>';
    document.getElementById('data-selecionada').textContent = '...';
    renderizarCalendario();
}

renderizarCalendario();
    
}

init();
