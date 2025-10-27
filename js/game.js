class ChronoCrafter {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.loadingScreen = document.getElementById('loading-screen');
        this.hud = document.getElementById('hud');
        this.craftingMenu = document.getElementById('crafting-menu');
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initGame();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    setupEventListeners() {
        // Teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Botões de era
        document.querySelectorAll('.era-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeEra(e.target.dataset.era);
            });
        });

        // Menu de crafting
        document.getElementById('close-crafting').addEventListener('click', () => {
            this.toggleCraftingMenu();
        });

        document.querySelectorAll('.craft-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.craftItem(e.currentTarget.dataset.item);
            });
        });
    }

    initGame() {
        // Configurações do jogo
        this.gameState = {
            player: {
                x: 100,
                y: 300,
                width: 40,
                height: 60,
                velocityX: 0,
                velocityY: 0,
                health: 100,
                maxHealth: 100,
                jumping: false
            },
            currentEra: 'modern',
            resources: {
                wood: 0,
                stone: 0,
                energy: 0
            },
            keys: {
                left: false,
                right: false,
                up: false
            },
            platforms: [
                { x: 0, y: 500, width: 300, height: 20 },
                { x: 400, y: 500, width: 300, height: 20 },
                { x: 800, y: 400, width: 200, height: 20 }
            ],
            enemies: [
                { x: 600, y: 450, width: 30, height: 50, type: 'basic' }
            ],
            gravity: 0.8,
            jumpPower: -15,
            moveSpeed: 5
        };

        // Simular loading
        this.simulateLoading();
    }

    simulateLoading() {
        let progress = 0;
        const loadingBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('#loading-screen p');

        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    this.startGame();
                }, 500);
            }
            
            loadingBar.style.width = `${progress}%`;
            
            if (progress < 30) loadingText.textContent = "Carregando linha do tempo...";
            else if (progress < 60) loadingText.textContent = "Preparando mecânicas...";
            else if (progress < 90) loadingText.textContent = "Inicializando eras...";
            else loadingText.textContent = "Pronto para viajar no tempo!";
        }, 200);
    }

    startGame() {
        this.loadingScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        
        // Iniciar loop do jogo
        this.gameLoop();
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.updatePlayer();
        this.updatePhysics();
        this.checkCollisions();
        this.updateHUD();
    }

    updatePlayer() {
        const player = this.gameState.player;
        const keys = this.gameState.keys;

        // Movimento horizontal
        player.velocityX = 0;
        if (keys.left) player.velocityX = -this.gameState.moveSpeed;
        if (keys.right) player.velocityX = this.gameState.moveSpeed;

        // Pulo
        if (keys.up && !player.jumping) {
            player.velocityY = this.gameState.jumpPower;
            player.jumping = true;
        }

        // Aplicar velocidade
        player.x += player.velocityX;
        player.y += player.velocityY;

        // Aplicar gravidade
        player.velocityY += this.gameState.gravity;

        // Limites da tela
        if (player.x < 0) player.x = 0;
        if (player.x > this.canvas.width - player.width) player.x = this.canvas.width - player.width;
    }

    updatePhysics() {
        const player = this.gameState.player;
        
        // Verificar colisão com plataformas
        player.jumping = true;
        
        this.gameState.platforms.forEach(platform => {
            if (this.checkCollision(player, platform)) {
                // Colisão por baixo
                if (player.velocityY > 0 && player.y + player.height > platform.y) {
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.jumping = false;
                }
            }
        });

        // Coletar recursos aleatórios
        if (Math.random() < 0.01) {
            this.collectResource();
        }
    }

    checkCollisions() {
        // Colisão com inimigos (simplificado)
        this.gameState.enemies.forEach(enemy => {
            if (this.checkCollision(this.gameState.player, enemy)) {
                this.gameState.player.health -= 0.5;
                if (this.gameState.player.health < 0) {
                    this.gameState.player.health = 0;
                    // Game Over - implementar depois
                }
            }
        });
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    collectResource() {
        const resources = this.gameState.resources;
        const era = this.gameState.currentEra;
        
        switch(era) {
            case 'prehistoric':
                resources.wood += Math.floor(Math.random() * 3) + 1;
                break;
            case 'medieval':
                resources.stone += Math.floor(Math.random() * 2) + 1;
                break;
            case 'modern':
                resources.wood += Math.floor(Math.random() * 2) + 1;
                resources.stone += Math.floor(Math.random() * 2) + 1;
                break;
            case 'future':
                resources.energy += Math.floor(Math.random() * 2) + 1;
                break;
        }
    }

    render() {
        const ctx = this.ctx;
        const player = this.gameState.player;
        
        // Limpar canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fundo baseado na era
        this.drawBackground();
        
        // Plataformas
        ctx.fillStyle = '#8B4513';
        this.gameState.platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Inimigos
        ctx.fillStyle = '#ff4444';
        this.gameState.enemies.forEach(enemy => {
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        // Jogador
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Olhos do jogador (para dar personalidade)
        ctx.fillStyle = '#000';
        ctx.fillRect(player.x + 25, player.y + 15, 5, 5);
        ctx.fillRect(player.x + 10, player.y + 15, 5, 5);
    }

    drawBackground() {
        const ctx = this.ctx;
        const era = this.gameState.currentEra;
        
        switch(era) {
            case 'prehistoric':
                ctx.fillStyle = '#8FBC8F';
                break;
            case 'medieval':
                ctx.fillStyle = '#D2B48C';
                break;
            case 'modern':
                ctx.fillStyle = '#87CEEB';
                break;
            case 'future':
                ctx.fillStyle = '#483D8B';
                break;
        }
        
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateHUD() {
        // Atualizar saúde
        const healthFill = document.querySelector('.health-fill');
        const healthText = document.querySelector('.health-text');
        const healthPercent = (this.gameState.player.health / this.gameState.player.maxHealth) * 100;
        
        healthFill.style.width = `${healthPercent}%`;
        healthText.textContent = `${Math.round(this.gameState.player.health)}/${this.gameState.player.maxHealth}`;

        // Atualizar recursos
        document.getElementById('wood-count').textContent = this.gameState.resources.wood;
        document.getElementById('stone-count').textContent = this.gameState.resources.stone;
        document.getElementById('energy-count').textContent = this.gameState.resources.energy;
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
                this.gameState.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                this.gameState.keys.right = true;
                break;
            case 'ArrowUp':
            case 'w':
            case ' ':
                this.gameState.keys.up = true;
                break;
            case 'c':
                this.toggleCraftingMenu();
                break;
            case '1':
                this.changeEra('prehistoric');
                break;
            case '2':
                this.changeEra('medieval');
                break;
            case '3':
                this.changeEra('modern');
                break;
            case '4':
                this.changeEra('future');
                break;
        }
    }

    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
                this.gameState.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                this.gameState.keys.right = false;
                break;
            case 'ArrowUp':
            case 'w':
            case ' ':
                this.gameState.keys.up = false;
                break;
        }
    }

    changeEra(era) {
        this.gameState.currentEra = era;
        
        // Atualizar UI
        document.querySelectorAll('.era-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.era === era) {
                btn.classList.add('active');
            }
        });
        
        document.querySelector('.era-name').textContent = this.getEraName(era);
        
        // Aplicar filtro visual
        this.canvas.className = `era-${era}`;
    }

    getEraName(era) {
        const names = {
            prehistoric: 'Era Pré-histórica',
            medieval: 'Era Medieval',
            modern: 'Era Moderna',
            future: 'Era Futurista'
        };
        return names[era];
    }

    toggleCraftingMenu() {
        this.craftingMenu.classList.toggle('hidden');
    }

    craftItem(item) {
        const resources = this.gameState.resources;
        
        switch(item) {
            case 'sword':
                if (resources.wood >= 10 && resources.stone >= 5) {
                    resources.wood -= 10;
                    resources.stone -= 5;
                    alert('Espada criada! ⚔️');
                } else {
                    alert('Recursos insuficientes!');
                }
                break;
            case 'shield':
                if (resources.wood >= 15 && resources.stone >= 8) {
                    resources.wood -= 15;
                    resources.stone -= 8;
                    alert('Escudo criado! 🛡️');
                } else {
                    alert('Recursos insuficientes!');
                }
                break;
            case 'platform':
                if (resources.wood >= 5) {
                    resources.wood -= 5;
                    // Adicionar plataforma no mundo
                    this.gameState.platforms.push({
                        x: this.gameState.player.x + 50,
                        y: this.gameState.player.y - 20,
                        width: 100,
                        height: 20
                    });
                    alert('Plataforma criada! 🧱');
                } else {
                    alert('Madeira insuficiente!');
                }
                break;
        }
    }
}

// Iniciar o jogo quando a página carregar
window.addEventListener('load', () => {
    new ChronoCrafter();
});
