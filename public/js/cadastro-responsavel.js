// ===== DADOS DO ADMIN (virá do backend futuramente) =====
const dadosAdmin = {
    nome: "Administrador",
    pacientes: []
};

document.getElementById('nome-admin').textContent = dadosAdmin.nome;

// Preenche select de pacientes vinculados
const selectPaciente = document.getElementById('paciente_vinculado');
dadosAdmin.pacientes.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nome;
    selectPaciente.appendChild(opt);
});

// ===== MÁSCARA CPF =====
document.getElementById('cpf').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.value = v;
});

// ===== MÁSCARA TELEFONE (função reutilizável) =====
function mascaraTelefone(el) {
    el.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '').slice(0, 11);
        if (v.length <= 10) {
            v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
        this.value = v;
    });
}

mascaraTelefone(document.getElementById('telefone'));
mascaraTelefone(document.getElementById('telefone2'));

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
    const obrigatorios = [
        { id: 'nome', label: 'Nome Completo' },
        { id: 'cpf', label: 'CPF' },
        { id: 'parentesco', label: 'Parentesco / Vínculo' },
        { id: 'telefone', label: 'Telefone Principal' },
        { id: 'email', label: 'E-mail' }
    ];

    for (const campo of obrigatorios) {
        const el = document.getElementById(campo.id);
        if (!el.value.trim()) {
            el.focus();
            mostrarToast(`Campo obrigatório não preenchido: ${campo.label}`, 'erro');
            return false;
        }
    }
    return true;
}

// ===== SALVAR RESPONSÁVEL =====
function salvarResponsavel() {
    if (!validarFormulario()) return;

    const responsavel = {
        nome: document.getElementById('nome').value.trim(),
        cpf: document.getElementById('cpf').value.trim(),
        data_nascimento: document.getElementById('data_nascimento').value,
        sexo: document.getElementById('sexo').value,
        parentesco: document.getElementById('parentesco').value,
        profissao: document.getElementById('profissao').value.trim(),
        paciente_id: document.getElementById('paciente_vinculado').value,
        telefone: document.getElementById('telefone').value.trim(),
        telefone2: document.getElementById('telefone2').value.trim(),
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
        observacoes: document.getElementById('observacoes').value.trim()
    };

    // Futuramente: enviar via fetch para a API
    console.log('Responsável a cadastrar:', responsavel);
    mostrarToast('✅ Responsável cadastrado com sucesso!', 'sucesso');

    // Redirecionar após cadastro (ajuste a rota conforme necessário)
    // setTimeout(() => window.location.href = '/responsaveis', 2000);
}
