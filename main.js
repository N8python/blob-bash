var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 300
      },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
var game = new Phaser.Game(config),
  platforms,
  player,
  cursors,
  bullets,
  lastDir = "right",
  cooldown = 0,
  enemies,
  frames = 0,
  enemyRecharge = 60,
  score = 0,
  scoreText,
  emitter,
  ammo = 100,
  ammoText,
  floatingAmmos,
  lives = 2,
  life1,
  life2,
  gameDone = false,
  gameOverText;

function preload() {
  this.load.image('ground', 'platform.png');
  this.load.image('sky', 'sky.png');
  this.load.image('bullet', 'enemy-bullet.png');
  this.load.image('blue', 'blue.png');
  this.load.image('red', 'red.png');
  this.load.spritesheet('dude', 'dude.png', {
    frameWidth: 32,
    frameHeight: 48
  });
  this.load.spritesheet('enemy', 'invader32x32x4.png', {
    frameWidth: 32,
    frameHeight: 32
  });
  this.load.spritesheet('explode', 'explode.png', {
    frameWidth: 128,
    frameHeight: 128
  })
}

function create() {
  this.add.image(400, 300, 'sky');
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  platforms.create(0, 400, 'ground');
  platforms.create(800, 400, 'ground');
  platforms.create(400, 300, 'ground');
  platforms.create(0, 200, 'ground');
  platforms.create(800, 200, 'ground');
  platforms.create(400, 100, 'ground');
  gameDone = true;
  this.physics.pause();
  swal({
    title: "Welcome to Blob Bash!",
    text: "Arrow keys to move, Space to shoot a ball.",
    icon: "info",
    button: "Ok, got it!"
  }).then(value => {
    swal({
      title: "The evil robots should probably be destroyed...",
      text: `The balls you shoot will blow up each evil robot. Each one will add one to your score.`,
      icon: "success",
      button: "Ok, got it!"
    }).then(value => {
      swal({
        title: "Don't let the evil robots touch you or escape",
        text: `Avoid the evil robots. Don't let them leave the screen or touch you, if you do. You lose a life. When you lose all your lives, it's game over.`,
        icon: "warning",
        button: "Ok, got it!"
      }).then(value => {
        swal({
          title: "Good Luck!",
          text: `Good luck - don't die too fast.`,
          icon: "success",
          button: "Thanks!"
        }).then(value => {
          gameDone = false;
          this.physics.resume();
        });
      });
    });
  });
  player = this.physics.add.sprite(100, 450, 'dude');
  var particles = this.add.particles('blue');

  emitter = particles.createEmitter({
    speed: 100,
    scale: {
      start: 1,
      end: 0
    },
    blendMode: 'ADD'
  });
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', {
      start: 0,
      end: 3
    }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'turn',
    frames: [{
      key: 'dude',
      frame: 4
    }],
    frameRate: 20
  });
  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', {
      start: 5,
      end: 8
    }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'enemyMove',
    frames: this.anims.generateFrameNumbers('enemy', {
      start: 0,
      end: 3
    }),
    frameRate: 10,
    repeat: 1000000
  });
  this.anims.create({
    key: 'explosion',
    frames: this.anims.generateFrameNumbers('explode', {
      start: 0,
      end: 15
    }),
    frameRate: 30,
    repeat: -1
  })
  this.physics.add.collider(player, platforms);
  cursors = this.input.keyboard.createCursorKeys();
  bullets = this.physics.add.group();
  this.physics.add.collider(bullets, platforms);
  this.physics.add.collider(bullets, bullets);
  this.physics.add.collider(bullets, player);
  enemies = this.physics.add.group({
    key: 'enemy',
    repeat: 5,
    setXY: {
      x: 16,
      y: 0,
      stepX: 150
    }
  });
  enemies.children.iterate(function(enemy) {
    enemy.anims.play('enemyMove');
    enemy.dir = (Math.random() < 0.5) ? "right" : "left";
  });
  this.physics.add.collider(player, enemies, loseLife, null, this);
  this.physics.add.collider(enemies, platforms);
  this.physics.add.collider(enemies, bullets, enemyDeath, null, this);
  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#000'
  });
  ammoText = this.add.text(600, 16, 'Ammo: 100', {
    fontSize: '32px',
    fill: '#000'
  });
  this.add.text(16, 550, "Lives: ", {
    fontSize: '32px',
    fill: '#000'
  });
  gameOverText = this.add.text(220, 300, "", {
    fontSize: '60px',
    fill: '#000'
  })
  floatingAmmos = this.physics.add.staticGroup();
  life1 = this.physics.add.staticSprite(160, 560, "dude");
  life1.alpha = 0.5;
  life2 = this.physics.add.staticSprite(200, 560, "dude");
  life2.alpha = 0.5;
}

function update() {
  if (!gameDone) {
    if (lives === 1) {
      life2.visible = false;
    }
    if (lives === 0) {
      life1.visible = false;
    }
    ammoText.setText("Ammo: " + ammo)
    emitter.startFollow({
      x: player.x,
      y: player.y - 10
    })
    frames++;
    if (frames % enemyRecharge === 0) {
      var newEnemy = enemies.create(Phaser.Math.Between(50, 750), 0, 'enemy');
      newEnemy.anims.play('enemyMove');
      newEnemy.dir = (Math.random() < 0.5) ? "right" : "left";
      if (enemyRecharge > 20 && Math.random() <= 0.3) enemyRecharge--;
    }
    cooldown--;
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play("left", true);
      lastDir = "left";
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play("right", true);
      lastDir = "right";
    } else {
      player.setVelocityX(0);
      player.anims.play("turn");
    }
    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
    if (cursors.down.isDown && !player.body.touching.down) {
      player.setVelocityY(player.body.velocity.y + 30);
    }
    if (cursors.space.isDown && cooldown < 1 && ammo > 0) {
      var bullet = bullets.create(player.x, player.y, 'bullet');
      bullet.setVelocityX((lastDir === "left") ? -400 : 400);
      ammo--;
      cooldown = 15;
    }
    enemies.children.iterate(function(enemy) {
      if (enemy.y < 450) {
        if (enemy.x > 800 && enemy.dir === "right") {
          enemy.dir = "left";
          enemy.setVelocityX(0);
        }
        if (enemy.x < 0 && enemy.dir === "left") {
          enemy.dir = "right";
          enemy.setVelocityX(0);
        }
      }
      if (enemy.dir === "right") {
        enemy.x += 1.5;
      }
      if (enemy.dir === "left") {
        enemy.x -= 1.5;
      }
      if (enemy.x < -3 || enemy.x > 803) {
        lives -= 1;
        enemy.destroy();
      }
    });
    floatingAmmos.children.iterate(function(child) {
      child.y -= 5;
      child.alpha -= 0.01;
      if (child.alpha <= 0) {
        child.disableBody();
      }
    }.bind(this));
  }
}

function enemyDeath(enemy, bullet) {
  ammoIncrease = Phaser.Math.Between(0, 3);
  ammo += ammoIncrease;
  for (var i = 0; i < ammoIncrease; i++) {
    floatingAmmos.create(enemy.x + Phaser.Math.Between(-10, 10), enemy.y, "bullet");
  }
  bullet.destroy();
  score += 1;
  scoreText.setText('Score: ' + score);
  setTimeout(function() {
    var explosion = this.physics.add.staticSprite(enemy.x, enemy.y, "explode");
    enemy.destroy();
    explosion.anims.play("explosion");
    setTimeout(function() {
      explosion.destroy();
    }, 467)
  }.bind(this), 10)
}

function loseLife(player, enemy) {
  lives -= 1;
  if (lives < 0) {
    gameOver(this.physics);
  }
  setTimeout(function() {
    var explosion = this.physics.add.staticSprite(enemy.x, enemy.y, "explode");
    enemy.destroy();
    explosion.anims.play("explosion");
    setTimeout(function() {
      explosion.destroy();
    }, 467)
  }.bind(this), 10)
  var deathParticles = this.add.particles('red');
  var deathEmitter = deathParticles.createEmitter({
    speed: 100,
    scale: {
      start: 1,
      end: 0
    },
    blendMode: 'Blend'
  });
  deathEmitter.startFollow(player);
  setTimeout(function() {
    deathParticles.destroy()
  }, 1000)

}

function gameOver(physics) {
  gameDone = true;
  physics.pause();
  player.setTint(0xff0000);
  player.anims.play('turn');
  enemies.children.iterate(function(enemy) {
    setTimeout(function() {
      var explosion = physics.add.staticSprite(enemy.x, enemy.y, "explode");
      enemy.destroy();
      explosion.anims.play("explosion");
      setTimeout(function() {
        explosion.destroy();
      }, 467)
    }.bind(this), 10)
  })
  bullets.children.iterate(function(bullet) {
    if (bullet) bullet.destroy();
  });
  gameOverText.setText("Game Over");
  setTimeout(function() {
    swal({
        title: "Game over...",
        text: "Play again?",
        icon: "error",
        buttons: ["Nah...", "Let's go!"]
      })
      .then(value => {
        if (value === true) {
          player.setVelocityX(0);
          player.setVelocityY(0);
          life2.visible = true;
          life1.visible = true;
          lives = 2;
          score = 0;
          scoreText.setText('Score: ' + score);
          ammo = 100;
          player.setTint();
          gameOverText.setText('');
          physics.resume();
          gameDone = false;
        } else {
          swal({
            title: "Thanks for playing anyway!",
            text: "Reload the page to play again if you change your mind!",
            icon: "info",
            button: "Ok... I'll come back later"
          });
        }
      })
  }, 1000);
}
