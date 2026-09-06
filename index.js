const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== CONFIGURAÇÕES BÁSICAS =====
let gameState = 'cutscene1';
let cutscene2Timer = 0;
let tempoSobrevivido = 0;
let tempoParaZerar = 240 * 60; // 4 minutos
let frameCount = 0;
let audio1Tocado = false;
let audio2Tocado = false;
let fudeuTerminou = false;
let mostrarBalao = false;
let botoes = [];
let zoomAsteroide = 1;
let tempoPosFudeu = 0;

// Fases
let cactosPulados = 0;
let meteoroPutasso = false;
let segundaFaseMeteoro = false;
let terceiraFaseMeteoro = false;
let quartaFaseMeteoro = false;
let quintaFase = false;
let sextaFase = false;
let setimaFase = false;

let mostrarBalaoMeteoro = false;
let mostrarBalaoDinoGrito = false;
let mostrarGritoDesespero = false;
let mostrarBalaoMatar = false;
let mostrarBalaoCalma = false;
let mostrarBalaoNao = false;
let mostrarBalaoValaFinal = false;
let mostrarBalaoAcaba = false;
let mostrarBalaoPikomon = false;
let mostrarBalaoCorre = false;

let pedacos = [];
let explosoes = [];
let screenShake = 0;
let audioValaTocado = false;

// Buracos de fogo
let buracos = [];
let tempoProximoBuraco = 0;

// Pterossauros (formação V)
let pterossauros = [];
let pteroSprite = new Image();
pteroSprite.src = 'sprites/ptero.png';

// ===== IMAGENS DO DINO =====
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

// ===== ÁUDIOS =====
const sons = {
    olhando1: new Audio(),
    olhando2: new Audio(),
    voTePegar: new Audio(),
    vala: new Audio(),
    mario: new Audio(),
    lutador: new Audio(),
    matar: new Audio(),
    calma: new Audio(),
    nao: new Audio(),
    acaba: new Audio(),
    pikomon: new Audio(),
    run: new Audio()          // música de fundo
};

sons.olhando1.src = 'memes/among.mp3';
sons.olhando2.src = 'memes/fudeu.mp3';
sons.voTePegar.src = 'memes/vo-te-pegar.mp3';
sons.vala.src = 'memes/vala-minha-nossa-senhora.mp3';
sons.mario.src = 'memes/mario.mp3';
sons.lutador.src = 'memes/lutador.mp3';
sons.matar.src = 'memes/matar.mp3';
sons.calma.src = 'memes/calma.mp3';
sons.nao.src = 'memes/nao.mp3';
sons.acaba.src = 'memes/acaba.mp3';
sons.pikomon.src = 'memes/pikomon.mp3';
sons.run.src = 'memes/run.mp3';
sons.run.volume = 0.45;   // volume mais baixo (0.0 até 1.0)

// Controle da música de fundo (2:08 → 2:40)
const RUN_START = 128; // 2:08
const RUN_END   = 160; // 2:40

sons.run.addEventListener('timeupdate', () => {
    if (sons.run.currentTime >= RUN_END) {
        sons.run.currentTime = RUN_START;
    }
});

sons.olhando2.addEventListener('ended', () => {
    fudeuTerminou = true;
    mostrarBalao = false;
    tempoPosFudeu = 0;

    // Começa a música de fundo DEPOIS que o dino termina de falar "FUDEU DE VEZ"
    setTimeout(() => {
        if (gameState === 'playing' || gameState === 'cutscene2') {
            sons.run.currentTime = RUN_START;
            sons.run.play().catch(() => {});
        }
    }, 400);
});

sons.voTePegar.addEventListener('ended', () => {
    mostrarBalaoMeteoro = false;
    soltarPedacos();
    if (!audioValaTocado) {
        tocarSom(sons.vala);
        audioValaTocado = true;
        mostrarBalaoDinoGrito = true;
        setTimeout(() => mostrarBalaoDinoGrito = false, 3500);
    }
});

function tocarSom(som) {
    if (!som.src) return;
    som.pause();
    som.currentTime = 0;
    som.play().catch(() => {});
}

function pararTodosOsSons() {
    Object.values(sons).forEach(som => {
        som.pause();
        som.currentTime = 0;
    });
}

// ===== OBJETOS =====
const ground = { y: 0, height: 40 };

const dino = {
    x: 80, y: 0, width: 85, height: 95,
    velocityY: 0, jumping: false, gravity: 0.8, jumpForce: -18,
    frame: 0, frameTimer: 0, morto: false,
    colWidth: 50, colHeight: 70, colOffsetX: 18, colOffsetY: 20
};

const cacto = {
    x: 0, y: 0, width: 30, height: 50, velocidade: 4, ativo: false
};

const asteroide = {
    x: 0, y: 0, size: 180, velocidadeX: 2.8, velocidadeY: 1.5
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

// ===== DESENHOS =====
function drawGround() {
    ctx.fillStyle = '#C2A36B';
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
    ctx.fillStyle = '#A88B4F';
    ctx.fillRect(0, ground.y + 26, canvas.width, 14);
    ctx.fillStyle = '#D4B87A';
    for (let i = 0; i < canvas.width; i += 38) {
        ctx.fillRect(i + 6, ground.y + 7, 5, 3);
        ctx.fillRect(i + 22, ground.y + 15, 4, 2);
        ctx.fillRect(i + 12, ground.y + 21, 6, 2);
    }
    ctx.fillStyle = '#8B7355';
    for (let i = 0; i < canvas.width; i += 55) {
        ctx.fillRect(i + 18, ground.y + 10, 3, 3);
        ctx.fillRect(i + 35, ground.y + 19, 4, 2);
    }
}

function drawDino() {
    let img;
    if (dino.morto) img = imagens.dead;
    else if (gameState === 'cutscene2') img = imagens.look;
    else if (dino.jumping) img = dino.velocityY < 0 ? imagens.jump1 : imagens.jump2;
    else {
        dino.frameTimer++;
        if (dino.frameTimer > 6) {
            dino.frame = (dino.frame + 1) % 3;
            dino.frameTimer = 0;
        }
        if (dino.frame === 0) img = imagens.run1;
        if (dino.frame === 1) img = imagens.run2;
        if (dino.frame === 2) img = imagens.run3;
    }
    if (!img || !img.complete) return;

    if (gameState === 'cutscene2') {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, -dino.x - dino.width, dino.y, dino.width, dino.height);
        ctx.restore();
    } else {
        ctx.drawImage(img, dino.x, dino.y, dino.width, dino.height);
    }
}

// ===== BALÕES (mantidos iguais) =====
function drawBalao() {
    if (!mostrarBalao) return;
    const balaoX = dino.x + dino.width / 2;
    const balaoY = dino.y - 30;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(balaoX - 70, balaoY - 45, 140, 40, 10);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(balaoX - 10, balaoY - 5);
    ctx.lineTo(balaoX, balaoY + 12);
    ctx.lineTo(balaoX + 10, balaoY - 5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FUDEU DE VEZ', balaoX, balaoY - 25);
}

function drawBalaoDinoGrito() {
    if (!mostrarBalaoDinoGrito) return;
    const balaoX = dino.x + dino.width / 2 + 40;
    const balaoY = dino.y - 50;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(balaoX - 90, balaoY - 30);
    ctx.lineTo(balaoX - 70, balaoY - 55);
    ctx.lineTo(balaoX - 30, balaoY - 45);
    ctx.lineTo(balaoX + 10, balaoY - 60);
    ctx.lineTo(balaoX + 50, balaoY - 40);
    ctx.lineTo(balaoX + 90, balaoY - 50);
    ctx.lineTo(balaoX + 80, balaoY - 10);
    ctx.lineTo(balaoX + 95, balaoY + 15);
    ctx.lineTo(balaoX + 50, balaoY + 25);
    ctx.lineTo(balaoX + 10, balaoY + 15);
    ctx.lineTo(balaoX - 30, balaoY + 30);
    ctx.lineTo(balaoX - 70, balaoY + 10);
    ctx.lineTo(balaoX - 95, balaoY + 20);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VALA MINHA', balaoX, balaoY - 15);
    ctx.fillText('NOSSA SENHORA', balaoX, balaoY + 5);
}

function drawBalaoMeteoro() {
    if (!mostrarBalaoMeteoro) return;
    const balaoX = 180, balaoY = 160;
    ctx.fillStyle = '#ffeeee';
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(balaoX - 130, balaoY - 40);
    ctx.lineTo(balaoX - 100, balaoY - 80);
    ctx.lineTo(balaoX - 50, balaoY - 55);
    ctx.lineTo(balaoX, balaoY - 95);
    ctx.lineTo(balaoX + 50, balaoY - 50);
    ctx.lineTo(balaoX + 110, balaoY - 85);
    ctx.lineTo(balaoX + 140, balaoY - 30);
    ctx.lineTo(balaoX + 120, balaoY + 20);
    ctx.lineTo(balaoX + 150, balaoY + 50);
    ctx.lineTo(balaoX + 80, balaoY + 70);
    ctx.lineTo(balaoX + 20, balaoY + 45);
    ctx.lineTo(balaoX - 40, balaoY + 75);
    ctx.lineTo(balaoX - 90, balaoY + 40);
    ctx.lineTo(balaoX - 140, balaoY + 60);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#aa0000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('tá fudido que eu vo lhe pega', balaoX, balaoY - 25);
    ctx.fillText('voce ta fudido eu vo lhe pega', balaoX, balaoY - 5);
    ctx.fillText('fi de rapariga', balaoX, balaoY + 15);
}

function drawGritoDesespero() {
    if (!mostrarGritoDesespero) return;
    const balaoX = dino.x + dino.width / 2 + 30;
    const balaoY = dino.y - 55;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(balaoX - 100, balaoY - 25);
    ctx.lineTo(balaoX - 80, balaoY - 55);
    ctx.lineTo(balaoX - 30, balaoY - 40);
    ctx.lineTo(balaoX + 20, balaoY - 65);
    ctx.lineTo(balaoX + 70, balaoY - 35);
    ctx.lineTo(balaoX + 110, balaoY - 50);
    ctx.lineTo(balaoX + 100, balaoY - 5);
    ctx.lineTo(balaoX + 120, balaoY + 20);
    ctx.lineTo(balaoX + 60, balaoY + 30);
    ctx.lineTo(balaoX + 10, balaoY + 15);
    ctx.lineTo(balaoX - 40, balaoY + 35);
    ctx.lineTo(balaoX - 90, balaoY + 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AAAAAAAAAAAAAAAAAAAHHH', balaoX, balaoY - 10);
}

function drawBalaoMatar() {
    if (!mostrarBalaoMatar) return;
    const balaoX = 180, balaoY = 150;
    ctx.fillStyle = '#ffe0e0';
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(balaoX - 110, balaoY - 35);
    ctx.lineTo(balaoX - 80, balaoY - 70);
    ctx.lineTo(balaoX - 30, balaoY - 50);
    ctx.lineTo(balaoX + 20, balaoY - 80);
    ctx.lineTo(balaoX + 70, balaoY - 45);
    ctx.lineTo(balaoX + 120, balaoY - 70);
    ctx.lineTo(balaoX + 130, balaoY - 20);
    ctx.lineTo(balaoX + 110, balaoY + 25);
    ctx.lineTo(balaoX + 140, balaoY + 50);
    ctx.lineTo(balaoX + 70, balaoY + 60);
    ctx.lineTo(balaoX + 10, balaoY + 40);
    ctx.lineTo(balaoX - 50, balaoY + 65);
    ctx.lineTo(balaoX - 100, balaoY + 30);
    ctx.lineTo(balaoX - 130, balaoY + 50);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#aa0000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('vo te mata agora', balaoX, balaoY + 5);
}

function drawBalaoCalma() {
    if (!mostrarBalaoCalma) return;
    const balaoX = dino.x + dino.width / 2 + 20;
    const balaoY = dino.y - 45;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(balaoX - 85, balaoY - 40, 170, 40, 12);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(balaoX - 10, balaoY);
    ctx.lineTo(balaoX, balaoY + 15);
    ctx.lineTo(balaoX + 10, balaoY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('calma ai paizão', balaoX, balaoY - 20);
}

function drawBalaoNao() {
    if (!mostrarBalaoNao) return;
    const balaoX = dino.x + dino.width / 2 + 25;
    const balaoY = dino.y - 55;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(balaoX - 95, balaoY - 30);
    ctx.lineTo(balaoX - 75, balaoY - 60);
    ctx.lineTo(balaoX - 25, balaoY - 45);
    ctx.lineTo(balaoX + 25, balaoY - 70);
    ctx.lineTo(balaoX + 75, balaoY - 40);
    ctx.lineTo(balaoX + 105, balaoY - 55);
    ctx.lineTo(balaoX + 95, balaoY - 10);
    ctx.lineTo(balaoX + 115, balaoY + 20);
    ctx.lineTo(balaoX + 55, balaoY + 30);
    ctx.lineTo(balaoX + 5, balaoY + 15);
    ctx.lineTo(balaoX - 45, balaoY + 35);
    ctx.lineTo(balaoX - 90, balaoY + 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NÃO NÃO NÃO NÃO', balaoX, balaoY - 10);
}

function drawBalaoValaFinal() {
    if (!mostrarBalaoValaFinal) return;
    const balaoX = dino.x + dino.width / 2 + 20;
    const balaoY = dino.y - 50;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(balaoX - 95, balaoY - 45, 190, 45, 12);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(balaoX - 10, balaoY);
    ctx.lineTo(balaoX, balaoY + 15);
    ctx.lineTo(balaoX + 10, balaoY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vala minha nossa senhora', balaoX, balaoY - 22);
}

function drawBalaoAcaba() {
    if (!mostrarBalaoAcaba) return;
    const balaoX = dino.x + dino.width / 2 + 20;
    const balaoY = dino.y - 50;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(balaoX - 110, balaoY - 45, 220, 45, 12);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(balaoX - 10, balaoY);
    ctx.lineTo(balaoX, balaoY + 15);
    ctx.lineTo(balaoX + 10, balaoY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('acaba pelo amor de deus', balaoX, balaoY - 22);
}

function drawBalaoPikomon() {
    if (!mostrarBalaoPikomon) return;
    const balaoX = 190, balaoY = 145;
    ctx.fillStyle = '#ffe0e0';
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(balaoX - 120, balaoY - 40);
    ctx.lineTo(balaoX - 90, balaoY - 75);
    ctx.lineTo(balaoX - 40, balaoY - 55);
    ctx.lineTo(balaoX + 10, balaoY - 85);
    ctx.lineTo(balaoX + 60, balaoY - 50);
    ctx.lineTo(balaoX + 120, balaoY - 75);
    ctx.lineTo(balaoX + 140, balaoY - 25);
    ctx.lineTo(balaoX + 120, balaoY + 25);
    ctx.lineTo(balaoX + 150, balaoY + 50);
    ctx.lineTo(balaoX + 80, balaoY + 65);
    ctx.lineTo(balaoX + 20, balaoY + 45);
    ctx.lineTo(balaoX - 40, balaoY + 70);
    ctx.lineTo(balaoX - 100, balaoY + 35);
    ctx.lineTo(balaoX - 140, balaoY + 55);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#aa0000';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('eu vo lhe pegar pikomon', balaoX, balaoY - 15);
    ctx.fillText('eu vo lhe achar', balaoX, balaoY + 8);
}

function drawBalaoCorre() {
    if (!mostrarBalaoCorre) return;
    pterossauros.forEach(p => {
        if (p.x > 40 && p.x < canvas.width - 40) {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(p.x - 35, p.y - 38, 70, 26, 8);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('corre corre', p.x, p.y - 22);
        }
    });
}

// ===== LÓGICA =====
function atualizarCacto() {
    if (!cacto.ativo) return;
    cacto.x -= cacto.velocidade;

    if (cacto.x + cacto.width < 0) {
        cacto.x = canvas.width + 50;
        cactosPulados++;

        if (cactosPulados === 4 && !meteoroPutasso) {
            meteoroPutasso = true;
            mostrarBalaoMeteoro = true;
            tocarSom(sons.voTePegar);
        }
        if (cactosPulados === 20 && !segundaFaseMeteoro) {
            segundaFaseMeteoro = true;
            mostrarGritoDesespero = true;
            const audio = sons.lutador;
            audio.currentTime = 0;
            audio.play().catch(() => {});
            const parar = () => setTimeout(() => audio.pause(), (audio.duration / 2) * 1000);
            if (audio.duration) parar(); else audio.onloadedmetadata = parar;
            setTimeout(() => { criarLevaPedacos(); screenShake = 22; }, 400);
            setTimeout(() => { criarLevaPedacos(); screenShake = 26; }, 1600);
            setTimeout(() => mostrarGritoDesespero = false, 4000);
        }
        if (cactosPulados === 31 && !terceiraFaseMeteoro) {
            terceiraFaseMeteoro = true;
            mostrarBalaoMatar = true;
            tocarSom(sons.matar);
            sons.matar.onended = () => {
                mostrarBalaoMatar = false;
                setTimeout(() => {
                    tocarSom(sons.calma);
                    mostrarBalaoCalma = true;
                    setTimeout(() => mostrarBalaoCalma = false, 3500);
                }, 3000);
            };
        }
        if (cactosPulados === 41 && !quartaFaseMeteoro) {
            quartaFaseMeteoro = true;
            mostrarBalaoNao = true;
            tocarSom(sons.nao);
            setTimeout(() => { criarLevaPedacos(); screenShake = 20; }, 300);
            setTimeout(() => { criarLevaPedacos(); screenShake = 24; }, 1100);
            setTimeout(() => { criarLevaPedacos(); screenShake = 28; }, 2000);
            setTimeout(() => mostrarBalaoNao = false, 4000);
        }
        if (cactosPulados === 54 && !quintaFase) {
            quintaFase = true;
            cacto.ativo = false;
            setTimeout(() => { criarLevaPedacos(); screenShake = 20; }, 500);
            setTimeout(() => { criarLevaPedacos(); screenShake = 24; }, 1600);
            setTimeout(() => {
                tocarSom(sons.vala);
                mostrarBalaoValaFinal = true;
                sons.vala.onended = () => {
                    mostrarBalaoValaFinal = false;
                    setTimeout(() => {
                        tocarSom(sons.acaba);
                        mostrarBalaoAcaba = true;
                        sons.acaba.onended = () => {
                            mostrarBalaoAcaba = false;
                            setTimeout(() => {
                                sextaFase = true;
                                setTimeout(() => { criarLevaPedacosFrente(); screenShake = 18; }, 300);
                                setTimeout(() => { criarLevaPedacosFrente(); screenShake = 22; }, 1200);
                                setTimeout(() => { criarLevaPedacosFrente(); screenShake = 26; }, 2200);

                                setTimeout(() => {
                                    setimaFase = true;
                                    mostrarBalaoPikomon = true;
                                    tocarSom(sons.pikomon);
                                    setTimeout(() => {
                                        sons.pikomon.pause();
                                        mostrarBalaoPikomon = false;
                                        soltarPterossauros();
                                    }, 4000);
                                }, 3500);
                            }, 500);
                        };
                    }, 3000);
                };
            }, 800);
        }
    }

    // desenha cacto
    const x = cacto.x, y = cacto.y;
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(x + 8, y, 14, 55);
    ctx.fillRect(x, y + 15, 12, 10);
    ctx.fillRect(x, y + 15, 8, 25);
    ctx.fillRect(x + 18, y + 25, 12, 10);
    ctx.fillRect(x + 22, y + 25, 8, 20);
    ctx.fillStyle = '#1F6B3F';
    ctx.fillRect(x + 11, y + 8, 2, 7);
    ctx.fillRect(x + 14, y + 22, 2, 7);
    ctx.fillRect(x + 11, y + 38, 2, 7);
    ctx.fillRect(x + 3, y + 20, 2, 5);
    ctx.fillRect(x + 25, y + 30, 2, 5);
}

function atualizarBuracos() {
    if (!sextaFase) return;
    tempoProximoBuraco--;
    if (tempoProximoBuraco <= 0) {
        buracos.push({
            x: canvas.width + 30,
            y: ground.y - 4,
            width: 48,
            height: 14,
            velocidade: cacto.velocidade + 0.8
        });
        tempoProximoBuraco = 100 + Math.random() * 60;
    }

    for (let i = buracos.length - 1; i >= 0; i--) {
        const b = buracos[i];
        b.x -= b.velocidade;

        ctx.fillStyle = '#2a1500';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.fillStyle = 'rgba(255, 80, 0, 0.7)';
        ctx.fillRect(b.x + 6, b.y - 6, b.width - 12, 7);
        ctx.fillStyle = 'rgba(255, 160, 0, 0.6)';
        ctx.fillRect(b.x + 10, b.y - 10, b.width - 20, 5);

        if (
            dino.x + dino.colOffsetX < b.x + b.width &&
            dino.x + dino.colOffsetX + dino.colWidth > b.x &&
            dino.y + dino.colOffsetY + dino.colHeight > b.y - 5
        ) {
            dino.morto = true;
            gameState = 'morto';
            tocarSom(sons.mario);
            criarBotoesMorte();
        }

        if (b.x + b.width < 0) buracos.splice(i, 1);
    }
}

// ===== PTEROSSAUROS EM FORMAÇÃO V (esquerda → direita) =====
function soltarPterossauros() {
    // Formação V: 1 na frente + 2 atrás (um em cima e um embaixo)
    const baseY = 130; // um pouco abaixo do meteoro
    const startX = -120;

    pterossauros = [
        { x: startX,       y: baseY,      velocidade: 3.8 }, // líder (frente)
        { x: startX - 70,  y: baseY - 45, velocidade: 3.8 }, // atrás cima
        { x: startX - 70,  y: baseY + 45, velocidade: 3.8 }  // atrás baixo
    ];
    mostrarBalaoCorre = true;
    setTimeout(() => mostrarBalaoCorre = false, 7000);
}

function atualizarPterossauros() {
    for (let i = pterossauros.length - 1; i >= 0; i--) {
        const p = pterossauros[i];
        p.x += p.velocidade; // da esquerda para a direita

        if (pteroSprite.complete) {
            ctx.drawImage(pteroSprite, p.x, p.y, 70, 40);
        }

        if (p.x > canvas.width + 100) {
            pterossauros.splice(i, 1);
        }
    }
}

function soltarPedacos() {
    criarLevaPedacos();
    setTimeout(() => { criarLevaPedacos(); screenShake = 14; }, 1200);
    setTimeout(() => { criarLevaPedacos(); screenShake = 16; }, 2400);
}

function criarLevaPedacos() {
    for (let i = 0; i < 12; i++) {
        pedacos.push({
            x: 60 + Math.random() * 160,
            y: 30 + Math.random() * 70,
            vx: (Math.random() - 0.5) * 7,
            vy: Math.random() * 3.5 + 2,
            size: 8 + Math.random() * 15,
            vida: 130
        });
    }
}

function criarLevaPedacosFrente() {
    for (let i = 0; i < 10; i++) {
        pedacos.push({
            x: 100 + Math.random() * 80,
            y: 40 + Math.random() * 50,
            vx: 6 + Math.random() * 5,
            vy: Math.random() * 2 + 1,
            size: 9 + Math.random() * 12,
            vida: 100
        });
    }
}

function atualizarPedacos() {
    for (let i = pedacos.length - 1; i >= 0; i--) {
        const p = pedacos[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.vida--;

        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 3, 0, Math.PI * 2);
        ctx.fill();

        if (p.y > ground.y - 10) {
            explosoes.push({ x: p.x, y: ground.y - 5, raio: 5, vida: 20 });
            pedacos.splice(i, 1);
            screenShake = Math.max(screenShake, 8);
        } else if (p.vida <= 0 || p.x > canvas.width + 50) {
            pedacos.splice(i, 1);
        }
    }
}

function atualizarExplosoes() {
    for (let i = explosoes.length - 1; i >= 0; i--) {
        const e = explosoes[i];
        e.raio += 1.2;
        e.vida--;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.raio, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 100, 0, ${e.vida / 20})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        if (e.vida <= 0) explosoes.splice(i, 1);
    }
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
        pararSonsExcetoMario();
        tocarSom(sons.mario);
        criarBotoesMorte();
    }
}

function pararSonsExcetoMario() {
    Object.keys(sons).forEach(chave => {
        if (chave !== 'mario') {
            sons[chave].pause();
            sons[chave].currentTime = 0;
        }
    });
}

function reiniciarJogo() {
    pararTodosOsSons();
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
    audio1Tocado = false;
    audio2Tocado = false;
    fudeuTerminou = false;
    mostrarBalao = false;
    zoomAsteroide = 1;
    tempoPosFudeu = 0;
    cactosPulados = 0;
    meteoroPutasso = false;
    segundaFaseMeteoro = false;
    terceiraFaseMeteoro = false;
    quartaFaseMeteoro = false;
    quintaFase = false;
    sextaFase = false;
    setimaFase = false;
    mostrarBalaoMeteoro = false;
    mostrarBalaoDinoGrito = false;
    mostrarGritoDesespero = false;
    mostrarBalaoMatar = false;
    mostrarBalaoCalma = false;
    mostrarBalaoNao = false;
    mostrarBalaoValaFinal = false;
    mostrarBalaoAcaba = false;
    mostrarBalaoPikomon = false;
    mostrarBalaoCorre = false;
    pedacos = [];
    explosoes = [];
    buracos = [];
    pterossauros = [];
    screenShake = 0;
    audioValaTocado = false;
    tempoProximoBuraco = 0;
    // Reinicia a música de fundo
    sons.run.currentTime = 128; // 2:08
    sons.run.volume = 0.45;
    sons.run.play().catch(() => {});
}

function criarBotoesMorte() {
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;
    botoes = [
        {
            texto: 'Tentar de Novo',
            x: centroX - 120, y: centroY + 40, width: 240, height: 50,
            acao: () => reiniciarJogo()
        },
        {
            texto: 'Voltar pro Início',
            x: centroX - 120, y: centroY + 110, width: 240, height: 50,
            acao: () => {
                pararTodosOsSons();
                gameState = 'cutscene1';
                dino.morto = false;
                cacto.ativo = false;
                cutscene2Timer = 0;
                asteroide.x = -200;
                asteroide.y = -60;
                asteroide.size = 180;
                // reset completo
                audio1Tocado = false;
                audio2Tocado = false;
                fudeuTerminou = false;
                mostrarBalao = false;
                zoomAsteroide = 1;
                tempoPosFudeu = 0;
                cactosPulados = 0;
                meteoroPutasso = false;
                segundaFaseMeteoro = false;
                terceiraFaseMeteoro = false;
                quartaFaseMeteoro = false;
                quintaFase = false;
                sextaFase = false;
                setimaFase = false;
                mostrarBalaoMeteoro = false;
                mostrarBalaoDinoGrito = false;
                mostrarGritoDesespero = false;
                mostrarBalaoMatar = false;
                mostrarBalaoCalma = false;
                mostrarBalaoNao = false;
                mostrarBalaoValaFinal = false;
                mostrarBalaoAcaba = false;
                mostrarBalaoPikomon = false;
                mostrarBalaoCorre = false;
                pedacos = [];
                explosoes = [];
                buracos = [];
                pterossauros = [];
                screenShake = 0;
                audioValaTocado = false;
            }
        }
    ];
}

function drawMorto() {

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('F', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('o dino beijou o cacto', canvas.width / 2, canvas.height / 2 + 10);

    botoes.forEach(botao => {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(botao.x, botao.y, botao.width, botao.height);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.strokeRect(botao.x, botao.y, botao.width, botao.height);
        ctx.fillStyle = '#fff';
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
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
        ctx.fillRect((i * 97) % canvas.width, (i * 53) % canvas.height, 2, 2);
    }
    ctx.beginPath();
    ctx.moveTo(asteroide.x - asteroide.size * 0.9, asteroide.y);
    ctx.lineTo(asteroide.x - 10, asteroide.y - asteroide.size * 0.35);
    ctx.lineTo(asteroide.x - 10, asteroide.y + asteroide.size * 0.35);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,120,0,0.6)';
    ctx.fill();
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
        asteroide.x = -140;
        asteroide.y = -110;
        asteroide.size = 620;
        audio1Tocado = false;
        audio2Tocado = false;
        fudeuTerminou = false;
        mostrarBalao = false;
        zoomAsteroide = 1;
        tempoPosFudeu = 0;
    }
}

function drawCutscene2() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tamanhoAtual = asteroide.size * zoomAsteroide;
    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, tamanhoAtual / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, tamanhoAtual / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fill();
    drawGround();
    drawDino();
    drawBalao();
    ctx.fillStyle = '#000';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('O dino olha o meteoro no céu...', canvas.width / 2, 60);
    cutscene2Timer++;
    if (cutscene2Timer > 180 && !audio1Tocado) {
        tocarSom(sons.olhando1);
        audio1Tocado = true;
    }
    if (audio1Tocado && zoomAsteroide < 1.15) zoomAsteroide += 0.0012;
    if (cutscene2Timer > 480 && !audio2Tocado) {
        tocarSom(sons.olhando2);
        audio2Tocado = true;
        mostrarBalao = true;
    }
    if (fudeuTerminou) {
        tempoPosFudeu++;
        if (tempoPosFudeu > 300) {
            gameState = 'playing';
            cacto.ativo = true;
            cacto.x = canvas.width + 100;
            cacto.velocidade = 4;
            dino.velocityY = 0;
            dino.jumping = false;
            dino.morto = false;
        }
    }
}

function drawPlaying() {
    if (screenShake > 0) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tamanhoAtual = asteroide.size * zoomAsteroide;
    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, tamanhoAtual / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(asteroide.x, asteroide.y, tamanhoAtual / 3, 0, Math.PI * 2);
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
    atualizarBuracos();
    atualizarPterossauros();
    verificarColisao();
    drawGround();
    drawDino();

    drawBalaoMeteoro();
    drawBalaoDinoGrito();
    drawGritoDesespero();
    drawBalaoMatar();
    drawBalaoCalma();
    drawBalaoNao();
    drawBalaoValaFinal();
    drawBalaoAcaba();
    drawBalaoPikomon();
    drawBalaoCorre();

    atualizarPedacos();
    atualizarExplosoes();

    if (screenShake > 0) ctx.restore();

    if (!dino.morto) {
        tempoSobrevivido++;
        frameCount++;
        if (frameCount % 400 === 0) {
            cacto.velocidade += 0.25;
            if (cacto.velocidade > 9) cacto.velocidade = 9;
        }
        if (tempoSobrevivido >= tempoParaZerar) gameState = 'ending';
    }
}

function drawEnding() {
    sons.run.pause();
    ctx.fillStyle = '#05051a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
        ctx.fillRect((i * 83) % canvas.width, (i * 47) % canvas.height, 2, 2);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Parabéns!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '22px Arial';
    ctx.fillText('O dino conseguiu fugir do meteoro...', canvas.width / 2, canvas.height / 2);
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('(Final provisório)', canvas.width / 2, canvas.height / 2 + 50);
}

// ===== CONTROLES =====
function jump() {
    if (!dino.jumping && !dino.morto && gameState === 'playing') {
        dino.velocityY = dino.jumpForce;
        dino.jumping = true;
    }
}

window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
});
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    jump();
});
canvas.addEventListener('click', e => {
    if (gameState !== 'morto') return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    botoes.forEach(botao => {
        if (mouseX >= botao.x && mouseX <= botao.x + botao.width &&
            mouseY >= botao.y && mouseY <= botao.y + botao.height) botao.acao();
    });
});
canvas.addEventListener('touchend', e => {
    if (gameState !== 'morto') return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    botoes.forEach(botao => {
        if (mouseX >= botao.x && mouseX <= botao.x + botao.width &&
            mouseY >= botao.y && mouseY <= botao.y + botao.height) botao.acao();
    });
});

// ===== LOOP =====
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'cutscene1') drawCutscene1();
    else if (gameState === 'cutscene2') drawCutscene2();
    else if (gameState === 'playing') drawPlaying();
    else if (gameState === 'morto') {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const tamanhoAtual = asteroide.size * zoomAsteroide;
        ctx.beginPath();
        ctx.arc(asteroide.x, asteroide.y, tamanhoAtual / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(asteroide.x, asteroide.y, tamanhoAtual / 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();
        drawGround();
        drawDino();
        drawMorto();
    } else if (gameState === 'ending') drawEnding();
    requestAnimationFrame(gameLoop);
}

gameLoop();