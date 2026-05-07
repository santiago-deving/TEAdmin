// Futuramente esses dados virão do backend após autenticação

async function terapeutaData(route) {
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
    const dadosTerapeuta = await terapeutaData('send_user');
    const consultasTerapeuta = await terapeutaData('send_horarios');

    document.getElementById('nome-terapeuta').textContent = dadosTerapeuta.nome;
    document.getElementById('nome-boas-vindas').textContent = dadosTerapeuta.nome;

    // Preenche horários
    const horarios = document.getElementById('horarios-lista');
    if (consultasTerapeuta.length === 0) {
        horarios.innerHTML = '<p class="carregando">Nenhum horário disponível.</p>';
    } else {
        horarios.innerHTML = consultasTerapeuta.map(h => `
            <div class="horario-item">
                <span class="horario-hora">${h.nome}`+` - ${h.hora_consulta}</span>
                <button class="btn-presente" value="/atender_consulta?id_consulta=${h.id_consulta}">&#9989</button>
                <button class="btn-ausente" value="/ausencia_consulta?id_consulta=${h.id_consulta}">&#10060</button>
            </div>
        `).join('');
    }

    const btnsPresente = document.getElementsByClassName('btn-presente');

    for (const btn of btnsPresente) {
        btn.addEventListener('click', async function() {
            try {
                const response = await fetch(this.value, { method: 'POST' });
                if (!response.ok) throw new Error(`Response status: ${response.status}`);
                const result = await response.json();
                console.log(result);
            } catch (error) {
                console.error(error.message);
            }
        });
    }
}

init();



// Preenche tabela de pacientes
// const tabela     = document.getElementById('tabela-pacientes');
// if (dadosTerapeuta.pacientes.length === 0) {
//     tabela.innerHTML = '<tr><td colspan="4" class="carregando">Nenhum paciente cadastrado ainda.</td></tr>';
// } else {
//     tabela.innerHTML = dadosTerapeuta.pacientes.map(p => {
//         const cor = p.frequencia >= 90 ? 'var(--verde)' : p.frequencia >= 70 ? '#f9a825' : 'var(--vermelho)';
//         const badge = p.frequencia >= 90 ? 'badge-verde' : p.frequencia >= 70 ? 'badge-amarelo' : 'badge-vermelho';
//         return `
//             <tr>
//                 <td>${p.nome}</td>
//                 <td>
//                     <span class="barra-mini-container">
//                         <span class="barra-mini" style="width:${p.frequencia}%; background-color:${cor};"></span>
//                     </span>
//                     ${p.frequencia}%
//                 </td>
//                 <td>${p.ultimaPresenca}</td>
//                 <td><span class="badge ${badge}">${p.status}</span></td>
//             </tr>
//         `;
//     }).join('');
// }


// Preenche pacientes atuais
// const pacientesGrid = document.getElementById('pacientes-grid');
// if (dadosTerapeuta.pacientes.length === 0) {
//     pacientesGrid.innerHTML = '<p class="carregando">Nenhum paciente cadastrado ainda.</p>';
// } else {
//     pacientesGrid.innerHTML = dadosTerapeuta.pacientes.map(p => `
//         <div class="paciente-card">
//             <div class="paciente-avatar">👦</div>
//             <div class="paciente-nome">${p.nome}</div>
//             <div class="paciente-info">${p.ultimaPresenca}</div>
//         </div>
//     `).join('');
// }