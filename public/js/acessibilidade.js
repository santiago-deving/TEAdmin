// ===== TAMANHO DE FONTE =====
let tamanhoFonte = 16;

function aumentarFonte() {
    if (tamanhoFonte < 24) {
        tamanhoFonte += 2;
        document.documentElement.style.setProperty('--fonte-base', tamanhoFonte + 'px');
        document.body.style.fontSize = tamanhoFonte + 'px';
    }
}

function diminuirFonte() {
    if (tamanhoFonte > 12) {
        tamanhoFonte -= 2;
        document.documentElement.style.setProperty('--fonte-base', tamanhoFonte + 'px');
        document.body.style.fontSize = tamanhoFonte + 'px';
    }
}

// ===== ALTO CONTRASTE =====
function alternarContraste() {
    document.body.classList.toggle('alto-contraste');
    const btn = document.getElementById('btn-contraste');
    btn.classList.toggle('ativo');
}

// ===== LEITURA DE TELA =====
let vozAtiva = false;

function alternarVoz() {
    vozAtiva = !vozAtiva;
    const btn = document.getElementById('btn-voz');
    btn.classList.toggle('ativo');

    if (vozAtiva) {
        falarTexto('Leitura de tela ativada. Clique em qualquer texto para ouvi-lo.');
        document.body.addEventListener('click', lerElementoClicado);
    } else {
        speechSynthesis.cancel();
        document.body.removeEventListener('click', lerElementoClicado);
        falarTexto('Leitura de tela desativada.');
    }
}

function lerElementoClicado(e) {
    const texto = e.target.innerText || e.target.textContent;
    if (texto && texto.trim()) {
        falarTexto(texto.trim());
    }
}

function falarTexto(texto) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
}

// ===== LIBRAS =====
function abrirLibras() {
    // Futuramente abrirá um widget de intérprete de Libras
    // Ex: integração com Hand Talk ou VLibras
    alert('Intérprete de Libras em breve disponível!');
}