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

function mascaraTelefone(el) {
    el.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '').slice(0, 11);
        v = v.length <= 10
            ? v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
            : v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        this.value = v;
    });
}
mascaraTelefone(document.getElementById('telefone'));
mascaraTelefone(document.getElementById('telefone2'));

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
        { id: 'nome',       label: 'Nome'                  },
        { id: 'sobrenome',  label: 'Sobrenome'             },
        { id: 'cpf',        label: 'CPF'                   },
        { id: 'parentesco', label: 'Parentesco / Vínculo'  },
        { id: 'telefone',   label: 'Telefone Principal'    },
        { id: 'email',      label: 'E-mail'                },
        { id: 'paciente_vinculado', label: 'Paciente Vinculado' },
        { id: 'senha',      label: 'Senha de acesso'       }
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

// ===== SALVAR RESPONSÁVEL =====
async function salvarResponsavel() {
    if (!validarFormulario()) return;

    const responsavel = {
        nome:            document.getElementById('nome').value.trim(),
        sobrenome:       document.getElementById('sobrenome').value.trim(),
        data_nascimento: document.getElementById('data_nascimento').value,
        sexo:            document.getElementById('sexo').value,
        cpf:             document.getElementById('cpf').value.replace(/\D/g, ''),
        email:           document.getElementById('email').value.trim(),
        senha:           document.getElementById('senha').value,
        id_paciente:     document.getElementById('paciente_vinculado').value, // <- faltava
        parentesco:      document.getElementById('parentesco').value           // <- faltava
};

    try {
        const res   = await fetch('/cadastro/responsavel', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(responsavel)
        });
        const dados = await res.json();
        if (!res.ok) throw new Error(dados.mensagem ?? 'Erro ao cadastrar responsável');
        mostrarToast('Responsável cadastrado com sucesso!', 'sucesso');
        setTimeout(() => window.location.href = '/cadastro-responsavel', 2000);
    } catch (err) {
        mostrarToast(err.message, 'erro');
    }
}

// ===== INIT =====
async function init() {
    const [dadosAdmin, dadosPaciente] = await Promise.all([
        getData('/send_user'),
        getData('/send_paciente_dados/todos')
    ]);

    // Nome do admin no header
    if (dadosAdmin) {
        document.getElementById('nome-admin').textContent = dadosAdmin.nome ?? dadosAdmin.login ?? '...';
    }

    // Preenche select de pacientes vinculados
    const selectPaciente = document.getElementById('paciente_vinculado');
    const pacientes = dadosPaciente?.pacientes ?? [];
    pacientes.forEach(p => {
        const opt = document.createElement('option');
        opt.value       = p.id_paciente;
        opt.textContent = `${p.nome} ${p.sobrenome}`;
        selectPaciente.appendChild(opt);
    });
}

init();
