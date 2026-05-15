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

// ----- Modal -----
let dataSelecionada  = '';
let calendarInstance = null;

function abrirModal(dateStr) {
    dataSelecionada = dateStr;
    const [ano, mes, dia] = dateStr.split('-');
    document.getElementById('modal-titulo').textContent = '📅 Novo Agendamento';
    document.getElementById('modal-data').value         = `${dia}/${mes}/${ano}`;
    document.getElementById('modal-paciente').value     = '';
    document.getElementById('modal-hora').value         = '';
    document.getElementById('modal-overlay').classList.add('ativo');
}

function fecharModal() {
    document.getElementById('modal-overlay').classList.remove('ativo');
}

function mostrarToast(msg, tipo = 'sucesso') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function confirmarAgendamento() {
    const paciente = document.getElementById('modal-paciente').value.trim();
    const hora     = document.getElementById('modal-hora').value;
    if (!paciente) { mostrarToast('Preencha o nome do paciente!', 'erro'); return; }

    const titulo     = hora ? `${hora} - ${paciente}` : paciente;
    const novoEvento = { title: titulo, start: dataSelecionada + (hora ? 'T' + hora : '') };

    calendarInstance.addEvent(novoEvento);
    fecharModal();
    mostrarToast('Agendamento salvo!', 'sucesso');
}

// ----- Fetch -----
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
    const dadosPaciente = await getData('/send_paciente_dados');
    const consultas     = dadosPaciente?.consultasLista ?? [];

    const statusMap = {
        1: { cor: '#7EC8E3', label: 'Agendado'  },
        2: { cor: '#4CAF50', label: 'Concluído'  },
        3: { cor: '#E76F51', label: 'Cancelado'  }
    };

    let terapeutaMap = {};
    if (dadosUsuario?.tipo === 2) {
        const dadosTerapeutas = await getData('/send_dados_terapeutas');
        (dadosTerapeutas?.terapeutas ?? []).forEach(t => {
            terapeutaMap[t.id_profissional] = t.nome;
        });
    }

    const eventos = consultas.map(c => {
        const nomeEvento = dadosUsuario?.tipo === 2
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
        initialView: 'dayGridMonth',
        locale:      'pt-br',
        buttonText:  { today: 'Hoje', month: 'Mês', week: 'Semana' },
        headerToolbar: {
            left:   'prev,next today',
            center: 'title',
            right:  ''
        },
        events: eventos,

        dateClick: function (info) {
            abrirModal(info.dateStr);
        },

        eventClick: function (info) {
            const startStr        = info.event.startStr.split('T')[0];
            const [ano, mes, dia] = startStr.split('-');
            dataSelecionada       = startStr;
            document.getElementById('modal-titulo').textContent = '📅 Consulta';
            document.getElementById('modal-data').value         = `${dia}/${mes}/${ano}`;
            document.getElementById('modal-paciente').value     = info.event.extendedProps.nome;
            document.getElementById('modal-hora').value         = info.event.extendedProps.hora;
            document.getElementById('modal-overlay').classList.add('ativo');
        }
    });

    calendarInstance.render();
});