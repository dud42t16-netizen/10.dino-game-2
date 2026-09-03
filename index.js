const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== CONFIGURAÇÕES BÁSICAS =====
let gameState = 'playing'; // vamos começar direto no modo jogando pra testar

// ===== OBJETOS DO JOGO =====
const ground = {
    y: 0,          // vai ser calculado depois
    height: 40
};

const dino = {
    x: 80,
    y: 0,
    width: 50,
    height: 60,
    color: '#333',
    velocityY: 0,
    jumping: false,
    gravity: 0.8,
    jumpForce: -18
};

const cactos = [];
const cactoLargura = 30;
const cactoAltura = 50;
let tempoProximoCacto = 0;
let velocidade = 3;
let frame = 0;

// ===== RESPONSIVO =====
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ground.y = canvas.height - ground.height;
    dino.y = ground.y - dino.height; // importante: reposiciona o dino
    dino.velocityY = 0;               // reseta a velocidade
    dino.jumping = false;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== FUNÇÕES DE DESENHO =====
function drawGround() {
    ctx.fillStyle = '#8B4513'; // marrom de terra
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
}

function drawDino() {
    ctx.fillStyle = dino.color;
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
}

function criarCacto() {
    cactos.push({
        x: canvas.width,
        y: ground.y - cactoAltura,
        width: cactoLargura,
        height: cactoAltura
    });
}

function atualizarCactos() {
    // Cria um novo cacto de tempos em tempos
    tempoProximoCacto--;
    if (tempoProximoCacto <= 0) {
        criarCacto();
        tempoProximoCacto = 80 + Math.random() * 60; // tempo aleatório
    }

    // Move e desenha os cactos
    for (let i = cactos.length - 1; i >= 0; i--) {
        const cacto = cactos[i];
        cacto.x -= velocidade;
        //cacto.x -= 3; // velocidade do cacto

        // Desenha o cacto
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(cacto.x, cacto.y, cacto.width, cacto.height);

        // Remove o cacto se ele saiu da tela
        if (cacto.x + cacto.width < 0) {
            cactos.splice(i, 1);
        }
    }

    frame++;
    if (frame % 500 === 0) {  // a cada 500 frames  aumenta um pouco
        velocidade += 0.3;
    }
}

function jump() {
    if (!dino.jumping) {
        dino.velocityY = dino.jumpForce;
        dino.jumping = true;
    }
}

// Controles
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

// ===== LOOP PRINCIPAL =====
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Céu
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Física do pulo
    dino.velocityY += dino.gravity;
    dino.y += dino.velocityY;

    // Impede que o dino caia através do chão
    if (dino.y + dino.height > ground.y) {
        dino.y = ground.y - dino.height;
        dino.velocityY = 0;
        dino.jumping = false;
    }

    // Desenha o chão e o dino
    atualizarCactos();
    verificarColisao();
    drawGround();
    drawDino();

    requestAnimationFrame(gameLoop);
}

// Inicia
gameLoop();

function verificarColisao() {
    for (let cacto of cactos) {
        // Verifica se o dino está encostando no cacto
        if (
            dino.x < cacto.x + cacto.width &&
            dino.x + dino.width > cacto.x &&
            dino.y < cacto.y + cacto.height &&
            dino.y + dino.height > cacto.y
        ) {
            // Bateu!
            reiniciarJogo();
            break;
        }
    }
}

function reiniciarJogo() {
    cactos.length = 0;
    dino.y = ground.y - dino.height;
    dino.velocityY = 0;
    dino.jumping = false;
    tempoProximoCacto = 100;
    velocidade = 6;
    frame = 0;
}