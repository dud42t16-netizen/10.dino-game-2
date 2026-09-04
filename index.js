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
    width: 85,          // tamanho visual
    height: 95,
    velocityY: 0,
    jumping: false,
    gravity: 0.8,
    jumpForce: -18,
    frame: 0,
    frameTimer: 0,
    morto: false,

    // Caixa de colisão (menor que a imagem)
    colWidth: 50,
    colHeight: 70,
    colOffsetX: 18,     // empurra a caixa um pouco pra dentro
    colOffsetY: 20
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

let botoes = [];

// ===== Variáveis (coloca no topo junto com as outras) =====
let tempoSobrevivido = 0;
let tempoParaZerar = 90 * 60; // 1 minuto e meio
let frameCount = 0;

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
    if (!cacto.ativo || dino.morto || gameState !== 'playing') return;

    const dinoColX = dino.x + dino.colOffsetX;
    const dinoColY = dino.y + dino.colOffsetY;

    if (
        dinoColX < cacto.x + cacto.width &&
        dinoColX + dino.colWidth > cacto.x &&
        dinoColY < cacto.y + cacto.height &&
        dinoColY + dino.colHeight > cacto.y
    ) {
        dino.morto = true;
        gameState = 'morto';
        criarBotoesMorte();
    }
}

function criarBotoesMorte() {
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;

    botoes = [
        {
            texto: 'Tentar de Novo',
            x: centroX - 120,
            y: centroY + 40,
            width: 240,
            height: 50,
            acao: () => reiniciarJogo()
        },
        {
            texto: 'Voltar pro Início',
            x: centroX - 120,
            y: centroY + 110,
            width: 240,
            height: 50,
            acao: () => {
                gameState = 'cutscene1';
                dino.morto = false;
                cacto.ativo = false;
                cutscene2Timer = 0;
                asteroide.x = -200;
                asteroide.y = -60;
                asteroide.size = 180;
            }
        }
    ];
}

function reiniciarJogo() {
    dino.y = ground.y - dino.height;
    dino.velocityY = 0;
    dino.jumping = false;
    dino.morto = false;
    dino.frame = 0;
    cacto.x = canvas.width + 50;
    cacto.velocidade = 4;
    cacto.ativo = true;
    gameState = 'playing';
    botoes = [];
    tempoSobrevivido = 0;
    frameCount = 0;
}

function drawMorto() {
    // Fundo escuro semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texto principal
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('O dino morreu!', canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px Arial';
    ctx.fillText('O meteoro ainda está vindo...', canvas.width / 2, canvas.height / 2 - 20);

    // Desenha os botões
    botoes.forEach(botao => {
        // Fundo do botão
        ctx.fillStyle = '#222';
        ctx.fillRect(botao.x, botao.y, botao.width, botao.height);

        // Borda
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.strokeRect(botao.x, botao.y, botao.width, botao.height);

        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(botao.texto, botao.x + botao.width / 2, botao.y + botao.height / 2);
    });
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
    // Céu
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
        // Física do pulo
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

    // Progresso + velocidade progressiva
    if (!dino.morto) {
        tempoSobrevivido++;
        frameCount++;

        // Aumenta a velocidade bem devagar
        if (frameCount % 400 === 0) {
            cacto.velocidade += 0.25;
            if (cacto.velocidade > 9) {
                cacto.velocidade = 9;
            }
        }

        // Zera depois de 1min30s
        if (tempoSobrevivido >= tempoParaZerar) {
            gameState = 'ending';
        }
    }
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

canvas.addEventListener('click', (e) => {
    if (gameState !== 'morto') return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    botoes.forEach(botao => {
        if (
            mouseX >= botao.x &&
            mouseX <= botao.x + botao.width &&
            mouseY >= botao.y &&
            mouseY <= botao.y + botao.height
        ) {
            botao.acao();
        }
    });
});

// Também funciona no celular
canvas.addEventListener('touchend', (e) => {
    if (gameState !== 'morto') return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    botoes.forEach(botao => {
        if (
            mouseX >= botao.x &&
            mouseX <= botao.x + botao.width &&
            mouseY >= botao.y &&
            mouseY <= botao.y + botao.height
        ) {
            botao.acao();
        }
    });
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
    } else if (gameState === 'morto') {
        // Desenha o cenário congelado (sem atualizar física nem cacto)
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Asteroide
        ctx.beginPath();
        ctx.arc(asteroide.x, asteroide.y, asteroide.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(asteroide.x, asteroide.y, asteroide.size / 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();

        drawGround();
        drawDino(); // dino morto parado

        // Cacto parado também
        if (cacto.ativo) {
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(cacto.x + 8, cacto.y, 14, cacto.height);
            ctx.fillRect(cacto.x, cacto.y + 15, 12, 10);
            ctx.fillRect(cacto.x, cacto.y + 15, 8, 25);
            ctx.fillRect(cacto.x + 18, cacto.y + 25, 12, 10);
            ctx.fillRect(cacto.x + 22, cacto.y + 25, 8, 20);
        }

     // Por cima a tela de morte
     drawMorto();
   }

    requestAnimationFrame(gameLoop);
}

// Inicia
gameLoop();