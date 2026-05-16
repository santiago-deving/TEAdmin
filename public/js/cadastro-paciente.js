// ===== FETCH BASE =====
async function getData(route) {
    try {
        const res = await fetch(route);
        if (!res.ok) throw new Error(`Response status: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

// ===== TOAST =====
function mostrarToast(mensagem, tipo = 'sucesso') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== MÁSCARAS =====
document.getElementById('cpf').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.value = v;
});

document.getElementById('telefone').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.length <= 10
        ? v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
        : v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    this.value = v;
});

document.getElementById('cep').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    this.value = v;
});

// ===== BUSCA CEP =====
document.getElementById('cep').addEventListener('blur', async function () {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
        const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
            document.getElementById('logradouro').value = data.logradouro || '';
            document.getElementById('bairro').value     = data.bairro     || '';
            document.getElementById('cidade').value     = data.localidade || '';
            document.getElementById('estado').value     = data.uf         || '';
            document.getElementById('numero').focus();
        }
    } catch (e) { console.warn('Erro ao buscar CEP:', e); }
});

// ===== VALIDAÇÃO =====
function validarFormulario() {
    const obrigatorios = [
        { id: 'nome',             label: 'Nome'              },
        { id: 'sobrenome',        label: 'Sobrenome'         },
        { id: 'data_nascimento',  label: 'Data de Nascimento'},
        { id: 'sexo',             label: 'Sexo'              }
    ];
    for (const campo of obrigatorios) {
        const el = document.getElementById(campo.id);
        if (!el || !el.value.trim()) {
            el?.focus();
            mostrarToast(`Campo obrigatório não preenchido: ${campo.label}`, 'erro');
            return false;
        }
    }
    return true;
}

// ===== SALVAR PACIENTE =====
async function salvarPaciente() {
    if (!validarFormulario()) return;

    const paciente = {
        nome:            document.getElementById('nome').value.trim(),
        sobrenome:       document.getElementById('sobrenome').value.trim(),
        data_nascimento: document.getElementById('data_nascimento').value,
        sexo:            document.getElementById('sexo').value,
        cpf:             document.getElementById('cpf').value.replace(/\D/g, '') // só números
    };

    try {
        const res   = await fetch('/cadastro/paciente', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(paciente)
        });
        const dados = await res.json();
        if (!res.ok) throw new Error(dados.mensagem ?? 'Erro ao cadastrar paciente');
        mostrarToast('Paciente cadastrado com sucesso!', 'sucesso');
        setTimeout(() => window.location.href = '/cadastro-paciente', 2000);
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
}

// ===== INIT =====
async function init() {
    const [dadosAdmin, dadosTerapeutas] = await Promise.all([
        getData('/send_user'),
        getData('/send_dados_terapeutas')
    ]);

    // Nome do admin no header
    if (dadosAdmin) {
        document.getElementById('nome-admin').textContent = dadosAdmin.nome ?? dadosAdmin.login ?? '...';
    }

    // Preenche select de terapeutas
    const selectTerapeuta = document.getElementById('terapeuta');
    const terapeutas = dadosTerapeutas?.terapeutas ?? [];
    terapeutas.forEach(t => {
        const opt = document.createElement('option');
        opt.value       = t.id_profissional;
        opt.textContent = t.especialidade ? `${t.nome} — ${t.especialidade}` : t.nome;
        selectTerapeuta.appendChild(opt);
    });
}

init();
