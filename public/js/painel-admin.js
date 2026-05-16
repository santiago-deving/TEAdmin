// ===== FETCH BASE =====
async function getData(route) {
    try {
        const response = await fetch(route);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(error.message);
        return null;
    }
}

// ===== HELPERS =====
const statusLabel = { 1: 'Agendado', 2: 'Concluído', 3: 'Cancelado' };
const statusCor   = { 1: '#7EC8E3',  2: '#4CAF50',   3: '#E76F51'   };

function inicioFimSemana() {
    const hoje  = new Date();
    const dia   = hoje.getDay(); // 0=dom
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - dia);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim };
}

function formatarData(dataStr) {
    return new Date(dataStr).toLocaleDateString('pt-BR');
}

function formatarHora(horaStr) {
    return horaStr?.slice(0, 5) ?? '';
}

// ===== EDITOR DE AGENDA =====
let todasConsultas = [];
let todosTerapeutas = [];

function renderAgendaSemana(idProfissional) {
    const grid = document.getElementById('agenda-grid');
    if (!idProfissional) {
        grid.innerHTML = '<p class="carregando">Selecione um terapeuta para ver a agenda.</p>';
        return;
    }

    const { inicio, fim } = inicioFimSemana();

    const consultasSemana = todasConsultas.filter(c => {
        const data = new Date(c.data_consulta);
        return String(c.id_profissional) === String(idProfissional)
            && data >= inicio && data <= fim;
    });

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const colunas = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(inicio);
        d.setDate(inicio.getDate() + i);
        return {
            label: `${diasSemana[i]} ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
            data:  d
        };
    });

    if (consultasSemana.length === 0) {
        grid.innerHTML = '<p class="carregando">Nenhuma consulta esta semana para este terapeuta.</p>';
        return;
    }

    grid.innerHTML = `
        <div class="agenda-semana">
            ${colunas.map(col => {
                const consultasDia = consultasSemana.filter(c => {
                    const d = new Date(c.data_consulta);
                    return d.toDateString() === col.data.toDateString();
                });
                return `
                    <div class="agenda-coluna">
                        <div class="agenda-dia-header">${col.label}</div>
                        <div class="agenda-dia-body">
                            ${consultasDia.length === 0
                                ? '<span class="agenda-vazio">—</span>'
                                : consultasDia.map(c => `
                                    <div class="agenda-evento" style="border-left: 3px solid ${statusCor[c.id_status] ?? '#7EC8E3'}">
                                        <span class="agenda-hora">${formatarHora(c.hora_consulta)}</span>
                                        <span class="agenda-paciente">${c.nome} ${c.sobrenome}</span>
                                        <span class="agenda-status" style="color:${statusCor[c.id_status]}">${statusLabel[c.id_status] ?? ''}</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ===== INIT =====
async function init() {
    const [dadosAdmin, dadosPaciente, dadosHoje, dadosTerapeutas] = await Promise.all([
        getData('/send_user'),
        getData('/send_paciente_dados'),
        getData('/send_paciente_dados/hoje'),
        getData('/send_dados_terapeutas')
    ]);

    if (!dadosAdmin) { console.error('Erro ao carregar dados do admin'); return; }

    // ----- Nome do admin -----
    document.getElementById('nome-admin').textContent       = dadosAdmin.nome;
    document.getElementById('nome-boas-vindas').textContent = dadosAdmin.nome;

    // ----- Listas base -----
    const pacientes          = dadosPaciente?.pacientes      ?? [];
    todasConsultas           = dadosPaciente?.consultasLista ?? [];
    todosTerapeutas          = dadosTerapeutas?.terapeutas   ?? [];
    const consultasHoje      = dadosHoje?.consultasLista     ?? [];
    const aguardando         = todasConsultas.filter(c => c.id_status === 1);

    // ----- Cards resumo -----
    document.getElementById('total-pacientes').textContent  = pacientes.length;
    document.getElementById('total-terapeutas').textContent = todosTerapeutas.length;
    document.getElementById('total-sessoes').textContent    = consultasHoje.length;
    document.getElementById('total-aguardando').textContent = aguardando.length;

    // ----- Select de terapeutas (agenda) -----
    const select = document.getElementById('select-terapeuta');
    todosTerapeutas.forEach(t => {
        const opt = document.createElement('option');
        opt.value       = t.id_profissional;
        opt.textContent = `${t.nome} — ${t.especialidade ?? ''}`.trim();
        select.appendChild(opt);
    });
    select.addEventListener('change', () => renderAgendaSemana(select.value));

    // ----- Ocupação por terapeuta -----
    const ocupacaoLista = document.getElementById('ocupacao-lista');
    if (todosTerapeutas.length === 0) {
        ocupacaoLista.innerHTML = '<p class="carregando">Nenhum dado disponível.</p>';
    } else {
        const contagens = todosTerapeutas.map(t => ({
            ...t,
            qtd: todasConsultas.filter(c => String(c.id_profissional) === String(t.id_profissional)).length
        }));
        const maxQtd = Math.max(...contagens.map(t => t.qtd), 1);

        ocupacaoLista.innerHTML = contagens.map(t => {
            const pct = Math.round((t.qtd / maxQtd) * 100);
            const cor = pct >= 85 ? '#E76F51' : pct >= 60 ? '#F4A261' : '#4CAF50';
            return `
                <div class="ocupacao-item">
                    <span class="ocupacao-nome">${t.nome}</span>
                    <div class="ocupacao-barra-bg">
                        <div class="ocupacao-barra" style="width:${pct}%; background:${cor};"></div>
                    </div>
                    <span class="ocupacao-pct">${t.qtd} consulta${t.qtd !== 1 ? 's' : ''}</span>
                </div>
            `;
        }).join('');
    }

    // ----- Pacientes aguardando -----
    const aguardandoLista = document.getElementById('aguardando-lista');
    if (aguardando.length === 0) {
        aguardandoLista.innerHTML = '<p class="carregando">Nenhum paciente aguardando.</p>';
    } else {
        // Busca nome do terapeuta pelo id_profissional
        const terapeutaMap = {};
        todosTerapeutas.forEach(t => { terapeutaMap[t.id_profissional] = t.nome; });

        aguardandoLista.innerHTML = aguardando.map(p => `
            <div class="aguardando-item">
                <div class="aguardando-info">
                    <span class="aguardando-nome">${p.nome} ${p.sobrenome}</span>
                    <span class="aguardando-data">
                        ${formatarData(p.data_consulta)} às ${formatarHora(p.hora_consulta)}
                        ${terapeutaMap[p.id_profissional] ? `· ${terapeutaMap[p.id_profissional]}` : ''}
                    </span>
                </div>
            </div>
        `).join('');
    }
}

init();
