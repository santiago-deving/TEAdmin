// ===== FUNÇÃO BASE DE FETCH =====
// Função genérica reutilizável para requisições GET ao backend
// Renomeada de responsavelData() para getData() seguindo o padrão do projeto
// Movida para fora do DOMContentLoaded para ficar no escopo global
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

// Retorna os dados do responsável logado
// Espera: { nome, filhoNome, terapeutas: [{ nome, especialidade, presenca }] }
async function sendUser() {
    return await getData('send_user');
}

// Retorna os dados das consultas do paciente vinculado ao responsável
// Espera: { consultas: [...] }
async function sendPacienteDados() {
    return await getData('send_paciente_dados');
}

// ===== INIT =====
// Alterado: dados do backend agora populam o HTML diretamente,
// substituindo o objeto dadosUsuario que era simulado localmente
async function init() {
    const dadosResponsavel = await sendUser();
    const freqTerapeutas = await getData('/send_freq_responsavel');

    document.getElementById('nome-usuario').textContent = dadosResponsavel.nome;
    document.getElementById('nome-boas-vindas').textContent = dadosResponsavel.nome;

    const lista = document.getElementById('frequencia-lista');

    if (!freqTerapeutas || freqTerapeutas.length === 0) {
        lista.innerHTML = '<p class="carregando">Nenhum dado disponível ainda.</p>';
        return;
    }

    lista.innerHTML = freqTerapeutas.map(t => {
        const freq = t.frequencia;
        const cor = freq >= 90 ? 'var(--verde)' : freq >= 70 ? '#f9a825' : 'var(--vermelho)';

        return `
            <div class="frequencia-card">
                <p class="terapeuta-nome">${t.nome} (${t.especialidade})</p>
                <div class="barra-container">
                    <div class="barra" style="width: ${freq}%; background-color: ${cor};">
                        ${freq.toFixed(1)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

init();

// ===== SIDEBAR =====
// Alterado: movida para fora do DOMContentLoaded junto com o restante do código,
// mantendo consistência com o padrão dos outros painéis do projeto
// Removido: console.log('clicked') que era debug esquecido no closeBtn
// Removido: objeto dadosUsuario simulado, substituído pelos dados reais do backend via init()
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