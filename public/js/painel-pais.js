// Futuramente esses dados virão do backend após autenticação
// Por enquanto simulei o que a API retornará
document.addEventListener("DOMContentLoaded",()=>{

const sidebarBtn = document.getElementById("menu_btn");
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');

sidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('aberto');
    overlay.classList.toggle('ativo');
});

overlay.addEventListener('click', ()=>{
    sidebar.classList.toggle('aberto');
    overlay.classList.toggle('ativo');
})

closeBtn.addEventListener('click', ()=>{
    console.log('clicked');
    sidebar.classList.toggle('aberto');
    overlay.classList.toggle('ativo');
})

async function responsavelData(route) {
    try {
        const response = await fetch(route);
        if(!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.log(error.message);
    }
}

async function init () {
    const dadosResponsavel = await responsavelData('send_user');
    const dadosConsultas = await responsavelData('send_paciente_dados');
}

init();

const dadosUsuario = {
    nome: "Usuário",         // virá do backend
    filhoNome: "seu filho(a)", // virá do backend
    terapeutas: [
        // virá do backend
        // { nome: "Terapeuta 1", especialidade: "Psicóloga", presenca: 100 },
        // { nome: "Terapeuta 2", especialidade: "Fonoaudiólogo", presenca: 80 },
    ]
};

// Preenche o nome do usuário na tela
document.getElementById('nome-usuario').textContent = dadosUsuario.nome;
document.getElementById('nome-boas-vindas').textContent = dadosUsuario.nome;

// Preenche a lista de frequência
const lista = document.getElementById('frequencia-lista');

if (dadosUsuario.terapeutas.length === 0) {
    lista.innerHTML = '<p class="carregando">Nenhum dado disponível ainda.</p>';
} else {
    lista.innerHTML = dadosUsuario.terapeutas.map(t => `
        <div class="frequencia-card">
            <p class="terapeuta-nome">${t.nome} (${t.especialidade})</p>
            <div class="barra-container">
                <div class="barra" style="width: ${t.presenca}%; background-color: ${t.presenca === 100 ? 'var(--verde)' : 'var(--azul)'};">
                    ${t.presenca}%
                </div>
            </div>
        </div>
    `).join('');
}
})
