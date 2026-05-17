// ----- Sidebar -----
const menuBtn   = document.getElementById('menu_btn');
const sidebar   = document.getElementById('sidebar');
const closeBtn  = document.getElementById('closeBtn');
const overlayEl = document.getElementById('overlay');

menuBtn.addEventListener('click',  () => { sidebar.classList.add('aberto');    overlayEl.classList.add('ativo'); });
closeBtn.addEventListener('click', () => { sidebar.classList.remove('aberto'); overlayEl.classList.remove('ativo'); });
overlayEl.addEventListener('click',() => { sidebar.classList.remove('aberto'); overlayEl.classList.remove('ativo'); });

// ----- Data de hoje -----
const hoje = new Date();
document.getElementById('data-hoje').textContent =
    hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

// ----- Estado global -----
let dataSelecionada   = '';
let calendarInstance  = null;
let tipoUsuario       = null; // 0 = responsável | 1 = terapeuta | 2 = admin
let listaPacientes    = [];   // [{ id_paciente, nome, sobrenome }]
let listaTerapeutas   = [];   // [{ id_profissional, nome, especialidade }]

const statusMap = {
    1: { cor: '#7EC8E3', label: 'Agendado'  },
    2: { cor: '#4CAF50', label: 'Concluído'  },
    3: { cor: '#E76F51', label: 'Cancelado'  }
};

// ----- Helpers -----
function getPacienteSelecionado() {
    const valor = document.getElementById('modal-paciente').value.trim();
    return listaPacientes.find(p => `${p.nome} ${p.sobrenome}` === valor) ?? null;
}

function mostrarToast(msg, tipo = 'sucesso') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ----- Monta select de terapeutas -----
function preencherSelectTerapeutas(idSelecionado = null) {

    const select = document.getElementById('modal-terapeuta');
    select.innerHTML = '<option value="">Selecione o terapeuta</option>';
    listaTerapeutas.forEach(t => {
        const opt = document.createElement('option');
        opt.value       = t.id_profissional;
        opt.textContent = t.especialidade ? `${t.nome} — ${t.especialidade}` : t.nome;
        if (String(t.id_profissional) === String(idSelecionado)) opt.selected = true;
        select.appendChild(opt);
    });
}

// ----- Configura visibilidade dos campos conforme tipo e modo -----
function configurarCamposModal(modoEdicao = false) {
    const grupoPaciente         = document.getElementById('grupo-paciente');
    const grupoTerapeuta        = document.getElementById('grupo-terapeuta');
    const grupoTerapeutaLeitura = document.getElementById('grupo-terapeuta-leitura');
    const btnConfirmar          = document.getElementById('btn-confirmar');
    const inputPaciente         = document.getElementById('modal-paciente');
    const inputHora             = document.getElementById('modal-hora');

    if (tipoUsuario === 0) {
        grupoPaciente.style.display         = '';
        grupoTerapeuta.style.display        = 'none';
        grupoTerapeutaLeitura.style.display = '';
        btnConfirmar.style.display          = 'none';
        inputPaciente.readOnly              = true;
        inputHora.readOnly                  = true;
        return;
    }

    grupoTerapeutaLeitura.style.display = 'none';
    btnConfirmar.style.display          = '';
    inputHora.readOnly                  = false;

    if (tipoUsuario === 1) {
        grupoPaciente.style.display  = '';
        grupoTerapeuta.style.display = 'none';
        inputPaciente.readOnly       = modoEdicao;
    }

    if (tipoUsuario === 2) {
        grupoPaciente.style.display  = '';
        grupoTerapeuta.style.display = '';
        inputPaciente.readOnly       = modoEdicao;
    }
}

// ----- Abre modal: editar consulta existente -----
function abrirModalEdicao(evento) {

    const startStr        = evento.startStr.split('T')[0];
    const [ano, mes, dia] = startStr.split('-');
    dataSelecionada       = startStr;

    const props = evento.extendedProps;
    

    document.getElementById('modal-titulo').textContent    = tipoUsuario === 0 ? '📅 Detalhes da Consulta' : '📅 Editar Consulta';
    document.getElementById('modal-data').value            = `${dia}/${mes}/${ano}`;
    document.getElementById('modal-paciente').value        = props.nome;
    document.getElementById('modal-hora').value            = props.hora;
    document.getElementById('modal-id-consulta').value     = props.id_consulta;
    document.getElementById('modal-id-paciente').value     = props.id_paciente;
    document.getElementById('modal-id-profissional').value = props.id_profissional;
    document.getElementById('modal-terapeuta-nome').value = props.terapeuta || 'Não informado';

    preencherSelectTerapeutas(props.id_profissional);
    configurarCamposModal(true);
    document.getElementById('modal-overlay').classList.add('ativo');
}

function fecharModal() {
    document.getElementById('modal-overlay').classList.remove('ativo');
}

// ----- Confirmar (POST / PUT) -----
async function confirmarAgendamento() {
    const hora       = document.getElementById('modal-hora').value;
    const idConsulta = document.getElementById('modal-id-consulta').value;

    // id_profissional: admin escolhe no select; terapeuta vem do campo oculto (preenchido na edição)
    // em novo agendamento de terapeuta, o backend usa a sessão diretamente
    const idProfissional = tipoUsuario === 2
        ? document.getElementById('modal-terapeuta').value
        : document.getElementById('modal-id-profissional').value;

    // id_paciente: tenta resolver pelo datalist; fallback para campo oculto (modo edição)
    const pacienteSelecionado = getPacienteSelecionado();
    const idPaciente = pacienteSelecionado
        ? pacienteSelecionado.id_paciente
        : document.getElementById('modal-id-paciente').value;

    if (!idPaciente)                              { mostrarToast('Selecione um paciente válido!', 'erro'); return; }
    if (!hora)                                    { mostrarToast('Preencha o horário!', 'erro'); return; }
    if (tipoUsuario === 2 && !idProfissional)     { mostrarToast('Selecione o terapeuta!', 'erro'); return; }

    const horaFormatada = `${hora}:00`; // HH:MM → HH:MM:SS

    // ── PUT: editar consulta existente ──────────────────────────────────────
    if (idConsulta) {
        try {
            const res = await fetch('/enviar_agendamento_editado', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_consulta:     idConsulta,
                    id_paciente:     idPaciente,
                    id_profissional: idProfissional,
                    data_consulta:   dataSelecionada,
                    hora_consulta:   horaFormatada
                })
            });
            const dados = await res.json();
            if (!res.ok) throw new Error(dados.mensagem ?? 'Erro ao editar agendamento');
            fecharModal();
            mostrarToast('Agendamento atualizado!', 'sucesso');
            setTimeout(() => location.reload(), 1500);
        } catch (err) {
            mostrarToast(err.message, 'erro');
        }
        return;
    }

    // ── POST: novo agendamento ──────────────────────────────────────────────
    try {
        const res = await fetch('/enviar_novo_agendamento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_paciente:     idPaciente,
                id_profissional: idProfissional, // backend ignora se tipo=1, usa sessão
                data_consulta:   dataSelecionada,
                hora_consulta:   horaFormatada
            })
        });
        const dados = await res.json();
        if (!res.ok) throw new Error(dados.mensagem ?? 'Erro ao criar agendamento');
        fecharModal();
        mostrarToast('Agendamento salvo!', 'sucesso');
        setTimeout(() => location.reload(), 1500);
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
}

// ----- Fetch genérico -----
async function getData(route) {
    try {
        const response = await fetch(route);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error.message);
    }
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', async function () {
    const dadosUsuario  = await getData('/send_user');
    tipoUsuario = dadosUsuario?.tipo ?? 0;

    const dadosPaciente = await getData('/send_paciente_dados');
    const consultas     = dadosPaciente?.consultasLista ?? [];

    // Monta lista de pacientes únicos para o datalist
    const pacientesMap = {};
    consultas.forEach(c => {
        if (!pacientesMap[c.id_paciente]) {
            pacientesMap[c.id_paciente] = {
                id_paciente: c.id_paciente,
                nome:        c.nome,
                sobrenome:   c.sobrenome
            };
        }
    });
    listaPacientes = Object.values(pacientesMap);

    const datalist = document.getElementById('lista-pacientes');
    listaPacientes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = `${p.nome} ${p.sobrenome}`;
        datalist.appendChild(opt);
    });

    // Terapeutas: só carrega se admin
    // Terapeutas: carrega para admin E responsável
    let terapeutaMap = {};
    if (tipoUsuario === 2 || tipoUsuario === 0) {
        const dadosTerapeutas = await getData('/send_dados_terapeutas');
        listaTerapeutas = dadosTerapeutas?.terapeutas ?? [];
        listaTerapeutas.forEach(t => { terapeutaMap[t.id_profissional] = t.nome; });
    }

    const eventos = consultas.map(c => {
        const nomeEvento = tipoUsuario === 2
            ? `${c.hora_consulta.slice(0,5)} - ${c.nome} ${c.sobrenome} (${terapeutaMap[c.id_profissional] ?? 'Terapeuta'})`
            : `${c.hora_consulta.slice(0,5)} - ${c.nome} ${c.sobrenome}`;

        return {
            title:           nomeEvento,
            start:           `${c.data_consulta.slice(0,10)}T${c.hora_consulta}`,
            backgroundColor: statusMap[c.id_status]?.cor ?? '#7EC8E3',
            borderColor:     statusMap[c.id_status]?.cor ?? '#7EC8E3',
            extendedProps: {
                id_paciente:     c.id_paciente,
                id_consulta:     c.id_consulta,
                id_profissional: c.id_profissional,
                status:          statusMap[c.id_status]?.label ?? '',
                nome:            `${c.nome} ${c.sobrenome}`,
                hora:            c.hora_consulta.slice(0,5),
                terapeuta:       terapeutaMap[c.id_profissional] ?? ''
            }
        };
    });

    const calendarEl = document.getElementById('calendar');
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
        initialView:   'dayGridMonth',
        locale:        'pt-br',
        buttonText:    { today: 'Hoje', month: 'Mês', week: 'Semana' },
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        events:        eventos,

        dateClick:  function (info) { abrirModal(info.dateStr);      },
        eventClick: function (info) { abrirModalEdicao(info.event);  }
    });

    calendarInstance.render();
});