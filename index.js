const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== CONFIGURAÇÕES BÁSICAS =====
let gameState = 'cutscene1';
let cutscene2Timer = 0;

// ===== CARREGANDO AS IMAGENS =====
const imagens = {
    run1: new Image(),
    run2: new Image(),
    run3: new Image(),
    jump1: new Image(),
    jump2: new Image(),
    dead: new Image(),
    look: new Image()
};

imagens.run1.src = 'sprites/sprite_01.png';
imagens.run2.src = 'sprites/sprite_02.png';
imagens.run3.src = 'sprites/sprite_03.png';
imagens.jump1.src = 'sprites/sprite_04.png';
imagens.jump2.src = 'sprites/sprite_05.png';
imagens.dead.src  = 'sprites/sprite_09.png';
imagens.look.src  = 'sprites/sprite_08.png';

// ===== OBJETOS DO JOGO =====
const ground = {
    y: 0,
    height: 40
};

const dino = {
    x: 80,
    y: 0,
    width: 70,          // tamanho que o dino vai ser desenhado
    height: 80,
    velocityY: 0,
    jumping: false,
    gravity: 0.8,
    jumpForce: -18,
    frame: 0,           // controla a animação de corrida
    frameTimer: 0,
    morto: false
};

const cacto = {
    x: 0,
    y: 0,
    width: 30,
    height: 50,
    velocidade: 4,
    ativo: false
};

const asteroide = {
    x: 0,
    y: 0,
    size: 180,
    velocidadeX: 2.8,
    velocidadeY: 1.5
};

// ===== RESPONSIVO =====
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ground.y = canvas.height - ground.height;
    dino.y = ground.y - dino.height;
    dino.velocityY = 0;
    dino.jumping = false;

    cacto.y = ground.y - cacto.height;

    if (gameState === 'cutscene1') {
        asteroide.x = -200;
        asteroide.y = -60;
        asteroide.size = 180;
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== FUNÇÕES DE DESENHO =====
function drawGround() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
}

function drawDino() {
    let img;

    if (dino.morto) {
        img = imagens.dead;
    } else if (gameState === 'cutscene2') {
        img = imagens.look;
    } else if (dino.jumping) {
        // Alterna entre os dois frames de pulo
        img = dino.velocityY < 0 ? imagens.jump1 : imagens.jump2;
    } else {
        // Animação de corrida
        dino.frameTimer++;
        if (dino.frameTimer > 6) {
            dino.frame = (dino.frame + 1) % 3;
            dino.frameTimer = 0;
        }
        if (dino.frame === 0) img = imagens.run1;
        if (dino.frame === 1) img = imagens.run2;
        if (dino.frame === 2) img = imagens.run3;
    }

    if (!img || !img.complete) return; // espera a imagem carregar

    if (gameState === 'cutscene2') {
        // Virado ao contrário (olhando pro asteroide)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, -dino.x - dino.width, dino.y, dino.width, dino.height);
        ctx.restore();
    } else {
        ctx.drawImage(img, dino.x, dino.y, dino.width, dino.height);
    }
}

function atualizarCacto() {
    if (!cacto.ativo) return;

    cacto.x -= cacto.velocidade;

    if (cacto.x + cacto.width < 0) {
        cacto.x = canvas.width + 50;
    }

    // Desenho temporário do cacto (depois a gente troca por imagem)
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(cacto.x + 8, cacto.y, 14, cacto.height);
    ctx.fillRect(cacto.x, cacto.y + 15, 12, 10);
    ctx.fillRect(cacto.x, cacto.y + 15, 8, 25);
    ctx.fillRect(cacto.x + 18, cacto.y + 25, 12, 10);
    ctx.fillRect(cacto.x + 22, cacto.y + 25, 8, 20);
}

function verificarColisao() {
    if (!cacto.ativo || dino.morto) return;

    if (
        dino.x < cacto.x + cacto.width &&
        dino.x + dino.width > cacto.x &&
        dino.y < cacto.y + cacto.height &&
        dino.y + dino.height > cacto.y
    ) {
        dino.morto = true;
        setTimeout(() => {
            reiniciarJogo();
        }, 800); // fica morto meio segundo antes de reiniciar
    }
}

function reiniciarJogo() {
    dino.y = ground.y - dino.height;
    dino.velocityY = 0;
    dino.jumping = false;
    dino.morto = false;
    dino.frame = 0;
    cacto.x = canvas.width + 50;
    cacto.velocidade = 4;
}

// ===== CUTSCENES =====
function drawCutscene1() {
    ctx.fillStyle = '#05051a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrelas
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 80; i++) {
        const sx = (i * 97) % canvas.width;
        const sy = (i * 53) % canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
    }

    // Cauda
    ctx.beginPath();
    ctx.moveTo(asteroide.x - asteroide.size * 0.9, asteroide.y);
    ctx.lineTo(asteroide.x - 10, asteroide.y - asteroide.size * 0.35);
    ctx.lineTo(asteroide.x - 10, asteroide.y + asteroide.size * 0.35);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 120, 0, 0.6)';
    ctx.fill();

    // Asteroide
    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, asteroide.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, asteroide.size / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fill();

    asteroide.x += asteroide.velocidadeX;
    asteroide.y += asteroide.velocidadeY;

    if (asteroide.x > canvas.width + asteroide.size) {
        gameState = 'cutscene2';
        cutscene2Timer = 0;
        asteroide.x = -120;
        asteroide.y = -90;
        asteroide.size = 540;
    }
}

function drawCutscene2() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Asteroide enorme
    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, asteroide.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, asteroide.size / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fill();

    drawGround();
    drawDino(); // aqui ele usa o sprite_08 virado

    ctx.fillStyle = '#000';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('O dino olha o meteoro no céu...', canvas.width / 2, 60);

    cutscene2Timer++;

    if (cutscene2Timer > 600) {
        gameState = 'playing';
        cacto.ativo = true;
        cacto.x = canvas.width + 100;
        cacto.velocidade = 4;
        dino.velocityY = 0;
        dino.jumping = false;
        dino.morto = false;
    }
}

function drawPlaying() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Asteroide enorme
    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, asteroide.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, asteroide.size / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fill();

    if (!dino.morto) {
        dino.velocityY += dino.gravity;
        dino.y += dino.velocityY;

        if (dino.y + dino.height > ground.y) {
            dino.y = ground.y - dino.height;
            dino.velocityY = 0;
            dino.jumping = false;
        }
    }

    atualizarCacto();
    verificarColisao();
    drawGround();
    drawDino();
}

function drawEnding() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Final da história (em breve)', canvas.width / 2, canvas.height / 2);
}

// ===== CONTROLES =====
function jump() {
    if (!dino.jumping && !dino.morto && gameState === 'playing') {
        dino.velocityY = dino.jumpForce;
        dino.jumping = true;
    }
}

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

    if (gameState === 'cutscene1') {
        drawCutscene1();
    } else if (gameState === 'cutscene2') {
        drawCutscene2();
    } else if (gameState === 'playing') {
        drawPlaying();
    } else if (gameState === 'ending') {
        drawEnding();
    }

    requestAnimationFrame(gameLoop);
}

// Inicia
gameLoop();