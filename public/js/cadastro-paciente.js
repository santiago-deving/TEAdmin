// ===== DADOS DO ADMIN (virá do backend futuramente) =====
const dadosAdmin = {
    nome: "Administrador",
    terapeutas: []
};

document.getElementById('nome-admin').textContent = dadosAdmin.nome;

// Preenche select de terapeutas
const selectTerapeuta = document.getElementById('terapeuta');
dadosAdmin.terapeutas.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.nome;
    selectTerapeuta.appendChild(opt);
});

// ===== MÁSCARA CPF =====
document.getElementById('cpf').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.value = v;
});

// ===== MÁSCARA TELEFONE =====
document.getElementById('telefone').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    this.value = v;
});

// ===== MÁSCARA CEP =====
document.getElementById('cep').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{5})(\d{0,3})/, '$1-$2');
    this.value = v;
});

// ===== BUSCA CEP (ViaCEP) =====
document.getElementById('cep').addEventListener('blur', async function () {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
            document.getElementById('logradouro').value = data.logradouro || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
            document.getElementById('numero').focus();
        }
    } catch (e) {
        console.warn('Erro ao buscar CEP:', e);
    }
});

// ===== TOAST =====
function mostrarToast(mensagem, tipo = 'sucesso') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== VALIDAÇÃO =====
function validarFormulario() {
    const obrigatorios = ['nome', 'data_nascimento', 'sexo'];
    for (const id of obrigatorios) {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
            el.focus();
            mostrarToast(`Campo obrigatório não preenchido: ${el.labels[0]?.textContent.replace(' *', '') || id}`, 'erro');
            return false;
        }
    }
    return true;
}

// ===== SALVAR PACIENTE =====
function salvarPaciente() {
    if (!validarFormulario()) return;

    const paciente = {
        nome: document.getElementById('nome').value.trim(),
        data_nascimento: document.getElementById('data_nascimento').value,
        cpf: document.getElementById('cpf').value.trim(),
        sexo: document.getElementById('sexo').value,
        diagnostico: document.getElementById('diagnostico').value.trim(),
        terapeuta_id: document.getElementById('terapeuta').value,
        status: document.getElementById('status').value,
        telefone: document.getElementById('telefone').value.trim(),
        email: document.getElementById('email').value.trim(),
        endereco: {
            cep: document.getElementById('cep').value.trim(),
            logradouro: document.getElementById('logradouro').value.trim(),
            numero: document.getElementById('numero').value.trim(),
            complemento: document.getElementById('complemento').value.trim(),
            bairro: document.getElementById('bairro').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            estado: document.getElementById('estado').value
        },
        plano_saude: {
            nome: document.getElementById('plano_nome').value.trim(),
            numero: document.getElementById('plano_numero').value.trim(),
            validade: document.getElementById('plano_validade').value
        },
        observacoes: document.getElementById('observacoes').value.trim()
    };

    // Futuramente: enviar via fetch para a API
    console.log('Paciente a cadastrar:', paciente);
    mostrarToast('✅ Paciente cadastrado com sucesso!', 'sucesso');

    // Redirecionar após cadastro (ajuste a rota conforme necessário)
    // setTimeout(() => window.location.href = '/pacientes', 2000);
}
