
class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");

        this.baseHealth = 100;
        this.resources = 150;
        this.wave = 0;

        this.enemies = [];
        this.towers = [];
        this.buildPads = [];

        this.waveRemaining = 0;
        this.spawning = false;
        this.gameOver = false;

        this.surrogateOwned = false;
        this.wombOwned = false;
        this.pendingSoldiers = [];
        this.deathSpawned = false;
    }

    create() {

        this.cameras.main.setBackgroundColor("#202124");
        window.gameScene = this;
        this.input.mouse.disableContextMenu();

        // BACKGROUND
        const background = this.add.graphics();

        background.fillStyle(0x292a2c, 1);
        background.fillRect(0, 0, 960, 600);

        for (let i = 0; i < 45; i++) {
            const x = Phaser.Math.Between(0, 960);
            const y = Phaser.Math.Between(0, 600);

            background.fillStyle(0x38383a, 0.5);
            background.fillCircle(x, y, Phaser.Math.Between(2, 5));
        }

        // ONE LONG WINDING PATH
        this.pathPoints = [
            { x: 50, y: 300 },
            { x: 170, y: 300 },
            { x: 170, y: 150 },
            { x: 330, y: 150 },
            { x: 330, y: 300 },
            { x: 490, y: 300 },
            { x: 490, y: 450 },
            { x: 650, y: 450 },
            { x: 650, y: 300 },
            { x: 815, y: 300 }
        ];

        this.midSpawnIndex = 5;
        this.enemyRoutes = [this.pathPoints];
        this.middleDriveway = [
            { x: 560, y: 90 },
            { x: 420, y: 90 },
            { x: 420, y: 300 },
            { x: 490, y: 300 }
        ];

        this.drawRoad();
        this.drawHeadquarters();

        // ENEMY SPAWNS
        const spawnPoints = [
            { x: 50, y: 300 },
            this.middleDriveway[0]
        ];

        spawnPoints.forEach((spawn) => {
            this.add.circle(spawn.x, spawn.y, 18, 0x8c2525);
        });

        this.add.text(20, 535, "DEATH'S ARMY", {
            fontSize: "12px",
            color: "#ff7777"
        });

        // BUILD LOCATIONS
        this.createBuildPads();

        this.createFacilityPads();

        this.createGenesisButton();

        // HUD
        this.hudText = this.add.text(20, 20, "", {
            fontSize: "17px",
            color: "#ffffff",
            lineSpacing: 10
        });

        this.updateHUD();

        // INSTRUCTIONS
        this.add.text(20, 555,
            "GRID: LEFT-CLICK TO BUILD/REPLACE  |  RIGHT-CLICK TOWER: SELL",
            {
                fontSize: "11px",
                color: "#aaaaaa"
            }
        );

        // FIRST WAVE
        
        this.startWave();
    }


    // CREATE GENESIS BUTTON
    createGenesisButton() {

        this.genesisButton = this.add.rectangle(
            760, 55, 180, 55,
            0x493d4f
        );

        this.genesisButton.setStrokeStyle(2, 0xa18aab);

        this.genesisLabel = this.add.text(
            760, 55,
            "INITIATE GENESIS\n75 ATP",
            {
                fontSize: "13px",
                color: "#ffffff",
                align: "center",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.genesisButton.setInteractive({
            useHandCursor: true
        });

        this.genesisButton.on("pointerover", () => {
            this.genesisButton.setFillStyle(0x66516f);
        });

        this.genesisButton.on("pointerout", () => {
            this.genesisButton.setFillStyle(0x493d4f);
        });

        this.genesisButton.on("pointerdown", () => {
            this.startReproduction();
        });
    }


startReproduction() {

    if (this.gameOver) return;

    // Check reproductive infrastructure
    if (!this.surrogateOwned && !this.wombOwned) {

        this.showMessage("NO REPRODUCTIVE FACILITY");
        return;
    }

    const cost = 75;

    if (this.resources < cost) {

        this.showMessage("NOT ENOUGH ATP");
        return;
    }

    // Pay for reproduction
    this.resources -= cost;

    // Surrogate is consumed per attempt.
    // Artificial womb remains permanent.
    if (this.surrogateOwned) {

        this.surrogateOwned = false;

        // Restore the surrogate purchasing location
        this.createFacilityPad(
            850, 145,
            "SURROGATE",
            35,
            "surrogate"
        );
    }

    this.updateHUD();

    this.showMessage("GENESIS SEQUENCE INITIATED");

    // Pause battlefield and launch minigame
    this.scene.launch("ReproductionScene");

    this.scene.pause("GameScene");
}


finishReproduction(success, score) {

    if (success && score >= 4) {

        this.pendingSoldiers.push(this.getSoldierTier(4));
        this.showMessage(
            "PERFECT OFFSPRING PRODUCED - SELECT DEPLOYMENT SITE"
        );

    } else if (score >= 1 && score <= 3) {

        this.pendingSoldiers.push(this.getSoldierTier(score));
        this.showMessage(
            "DEFECTIVE OFFSPRING PRODUCED - GRADE " + score
        );

    } else {

        this.showMessage("NO VIABLE OFFSPRING PRODUCED");

    }

    this.updateHUD();
}

getSoldierTier(correctPairs) {

    const tiers = {
        0: {
            name: "INERT",
            damage: 0,
            range: 0,
            attackInterval: 100000
        },
        1: {
            name: "GRADE 1",
            damage: 6,
            range: 115,
            attackInterval: 1100
        },
        2: {
            name: "GRADE 2",
            damage: 10,
            range: 145,
            attackInterval: 850
        },
        3: {
            name: "GRADE 3",
            damage: 13,
            range: 165,
            attackInterval: 760
        },
        4: {
            name: "GRADE 4",
            damage: 15,
            range: 175,
            attackInterval: 700
        }
    };

    return { ...tiers[correctPairs] };
}



deployNewGeneration(location) {

    if (!location || this.pendingSoldiers.length <= 0) return;

    const tier = this.pendingSoldiers.shift();

    if (tier.damage <= 0) {
        this.showMessage("NO VIABLE SOLDIER");
        this.updateHUD();
        return;
    }

    let replacementRefund = 0;
    if (location.tower) {
        replacementRefund = location.tower.sellValue
            || Math.ceil(35 / 2);
        this.resources += replacementRefund;
    }

    this.removeTowerAtLocation(location);

    location.occupied = true;

    // Remove construction pad if it has not already been replaced
    if (location.pad && location.pad.active) {
        location.pad.destroy();
    }
    if (location.label && location.label.active) {
        location.label.destroy();
    }

    // Draw attack range
    const rangeCircle = this.add.circle(
        location.x,
        location.y,
        tier.range,
        0x6485a0,
        0.07
    );

    rangeCircle.setStrokeStyle(
        1, 0x6485a0, 0.25
    );

    // Draw soldier
    const body = this.add.circle(
        location.x,
        location.y,
        19,
        0x547b9c
    );

    body.setStrokeStyle(3, 0xa5c8df);

    const symbol = this.add.text(
        location.x,
        location.y,
        tier.name === "GRADE 4" ? "N" : tier.name.replace("GRADE ", "G"),
        {
            fontSize: "17px",
            color: "#ffffff",
            fontStyle: "bold"
        }
    ).setOrigin(0.5);

    const soldier = {

        x: location.x,
        y: location.y,

        body: body,
        symbol: symbol,
        rangeCircle: rangeCircle,

        damage: tier.damage,
        range: tier.range,

        attackInterval: tier.attackInterval,
        attackCooldown: 0,
        sellValue: Math.ceil(75 / 2),
        towerType: "generation"

    };

    this.towers.push(soldier);
    location.tower = soldier;
    this.makeTowerReplaceable(location, soldier);

    this.showMessage(
        replacementRefund > 0
            ? "REPLACEMENT REFUND +" + replacementRefund + " ATP"
            : "NEW GENERATION DEPLOYED"
    );

    this.updateHUD();
}

removeTowerAtLocation(location) {

    if (!location.tower) return;

    const tower = location.tower;
    tower.body.destroy();
    tower.symbol.destroy();
    tower.rangeCircle.destroy();
    if (tower.supportCircle) {
        tower.supportCircle.destroy();
    }

    const index = this.towers.indexOf(tower);
    if (index !== -1) {
        this.towers.splice(index, 1);
    }

    location.tower = null;
}

makeTowerReplaceable(location, tower) {

    if (!tower || !tower.body) return;

    const replaceTower = () => {
        this.purchaseVeteran(location);
    };

    tower.body.setInteractive({ useHandCursor: true });
    tower.body.on("pointerdown", (pointer) => {
        if (pointer.button === 2) {
            this.sellTower(location);
        } else {
            replaceTower();
        }
    });

    if (tower.symbol) {
        tower.symbol.setInteractive({ useHandCursor: true });
        tower.symbol.on("pointerdown", (pointer) => {
            if (pointer.button === 2) {
                this.sellTower(location);
            } else {
                replaceTower();
            }
        });
    }

    if (tower.rangeCircle) {
        tower.rangeCircle.setInteractive(
            new Phaser.Geom.Circle(location.x, location.y, 28),
            Phaser.Geom.Circle.Contains
        );
        tower.rangeCircle.on("pointerdown", (pointer) => {
            if (pointer.button === 2) {
                this.sellTower(location);
            } else {
                replaceTower();
            }
        });
        tower.rangeCircle.setDepth(-1);
    }
}

sellTower(location) {

    if (!location || !location.tower) return;

    const tower = location.tower;
    const refund = tower.sellValue || Math.ceil(35 / 2);

    this.removeTowerAtLocation(location);

    location.occupied = false;
    this.resources += refund;

    const pad = this.add.circle(
        location.x,
        location.y,
        10,
        0x36383b,
        0.45
    );
    pad.setStrokeStyle(1, 0x777777, 0.8);
    pad.setInteractive({ useHandCursor: true });

    location.pad = pad;
    location.label = null;
    location.tower = null;

    pad.on("pointerover", () => {
        if (!location.occupied && !this.gameOver) {
            pad.setFillStyle(0x555044, 0.8);
            pad.setStrokeStyle(2, 0xd6b56a);
        }
    });

    pad.on("pointerout", () => {
        if (!location.occupied) {
            pad.setFillStyle(0x36383b, 0.45);
            pad.setStrokeStyle(1, 0x777777, 0.8);
        }
    });

    pad.on("pointerdown", () => {
        this.purchaseVeteran(location);
    });

    this.showMessage("TOWER SOLD - +" + refund + " ATP");
    this.updateHUD();
}



    // CREATE REPRODUCTIVE FACILITY LOCATIONS
    createFacilityPads() {


    this.createFacilityPad(
        850, 145,
        "SURROGATE",
        35,
        "surrogate"
    );

    this.createFacilityPad(
        850, 455,
        "ARTIFICIAL WOMB",
        150,
        "womb"
    );
}


// CREATE INDIVIDUAL FACILITY PAD
createFacilityPad(x, y, label, cost, type) {

    const pad = this.add.circle(
        x, y, 24, 0x302d38
    );

    pad.setStrokeStyle(3, 0xa18aab);

    const text = this.add.text(
        x, y + 34,
        label + "\n" + cost + " ATP",
        {
            fontSize: "11px",
            color: "#c5b5d0",
            align: "center"
        }
    ).setOrigin(0.5);

    pad.setInteractive({
        useHandCursor: true
    });

    const facility = {
        x: x,
        y: y,
        pad: pad,
        label: text,
        type: type,
        purchased: false
    };

    pad.on("pointerover", () => {
        if (!facility.purchased && !this.gameOver) {
            pad.setFillStyle(0x51445b);
        }
    });

    pad.on("pointerout", () => {
        if (!facility.purchased) {
            pad.setFillStyle(0x302d38);
        }
    });

    pad.on("pointerdown", () => {
        this.purchaseFacility(facility);
    });

    if (!this.facilityPads) {
        this.facilityPads = [];
    }

    this.facilityPads.push(facility);
}


// PURCHASE FACILITY
purchaseFacility(facility) {

    if (this.gameOver) return;

    if (facility.purchased) return;

    const cost = facility.type === "surrogate"
        ? 35
        : 150;

    if (this.resources < cost) {
        this.showMessage("NOT ENOUGH ATP");
        return;
    }

    this.resources -= cost;

    facility.purchased = true;

    if (facility.type === "surrogate") {
        this.surrogateOwned = true;
    }

    if (facility.type === "womb") {
        this.wombOwned = true;
    }

    // Replace construction pad with facility
    facility.pad.destroy();
    facility.label.destroy();

    const building = this.add.circle(
        facility.x,
        facility.y,
        25,
        0x51445b
    );

    building.setStrokeStyle(3, 0xc5a6d5);

    const symbol = facility.type === "surrogate"
        ? "S"
        : "W";

    this.add.text(
        facility.x,
        facility.y,
        symbol,
        {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold"
        }
    ).setOrigin(0.5);

    this.showMessage(
        facility.type === "surrogate"
            ? "SURROGATE ACQUIRED"
            : "ARTIFICIAL WOMB ESTABLISHED"
    );

    this.updateHUD();
}


    // DRAW ROAD
    drawRoad() {
        for (const route of [this.pathPoints, this.middleDriveway]) {
            const road = this.add.graphics();

            road.lineStyle(46, 0x555052, 1);
            road.beginPath();
            road.moveTo(route[0].x, route[0].y);
            for (const point of route.slice(1)) {
                road.lineTo(point.x, point.y);
            }
            road.strokePath();

            road.lineStyle(2, 0x777073, 0.4);
            road.beginPath();
            road.moveTo(route[0].x, route[0].y);
            for (const point of route.slice(1)) {
                road.lineTo(point.x, point.y);
            }
            road.strokePath();
        }
    }

    // HEADQUARTERS
    drawHeadquarters() {

        const graphics = this.add.graphics();

        graphics.fillStyle(0x393b40, 1);
        graphics.fillRect(815, 265, 85, 70);

        graphics.lineStyle(4, 0x888888, 1);
        graphics.strokeRect(815, 265, 85, 70);

        graphics.fillStyle(0x9b3030, 1);
        graphics.fillCircle(857, 300, 13);

        this.add.text(810, 340, "HUMANITY HQ", {
            fontSize: "12px",
            color: "#ffffff"
        });

        this.hqHealthBackground = this.add.rectangle(
            857, 355, 86, 10, 0x333333
        );
        this.hqHealthBackground.setStrokeStyle(1, 0x777777);

        this.hqHealthBar = this.add.rectangle(
            814, 355, 86, 10, 0x67a76f
        );
        this.hqHealthBar.setOrigin(0, 0.5);

        this.updateHQHealthBar();
    }

    updateHQHealthBar() {

        if (!this.hqHealthBar) return;

        const healthRatio = Math.max(0, this.baseHealth / 100);
        this.hqHealthBar.width = 86 * healthRatio;

        if (healthRatio <= 0.3) {
            this.hqHealthBar.setFillStyle(0xb83d3d);
        } else if (healthRatio <= 0.6) {
            this.hqHealthBar.setFillStyle(0xd6b56a);
        } else {
            this.hqHealthBar.setFillStyle(0x67a76f);
        }
    }

    // CREATE BUILD LOCATIONS
    createBuildPads() {
        for (let y = 60; y <= 540; y += 60) {
            for (let x = 40; x <= 920; x += 60) {
                if (this.isGridBlocked(x, y)) continue;

                const pad = this.add.circle(
                    x,
                    y,
                    10,
                    0x36383b,
                    0.45
                );

                pad.setStrokeStyle(1, 0x777777, 0.8);
                pad.setInteractive({ useHandCursor: true });

                const buildLocation = {
                    x,
                    y,
                    pad,
                    label: null,
                    occupied: false
                };

                pad.on("pointerover", () => {
                    if (!buildLocation.occupied && !this.gameOver) {
                        pad.setFillStyle(0x555044, 0.8);
                        pad.setStrokeStyle(2, 0xd6b56a);
                    }
                });

                pad.on("pointerout", () => {
                    if (!buildLocation.occupied) {
                        pad.setFillStyle(0x36383b, 0.45);
                        pad.setStrokeStyle(1, 0x777777, 0.8);
                    }
                });

                pad.on("pointerdown", () => {
                    this.purchaseVeteran(buildLocation);
                });

                this.buildPads.push(buildLocation);
            }
        }
    }

    isGridBlocked(x, y) {

        if (x >= 805 && x <= 905 && y >= 250 && y <= 350) return true;
        if (x >= 30 && x <= 75 && y >= 280 && y <= 320) return true;
        if (x >= 810 && x <= 910 && y >= 125 && y <= 165) return true;
        if (x >= 810 && x <= 910 && y >= 435 && y <= 475) return true;
        if (x < 300 && y < 180) return true;
        if (x > 650 && y < 120) return true;

        for (const route of [this.pathPoints, this.middleDriveway]) {
            for (let i = 0; i < route.length - 1; i++) {
                const a = route[i];
                const b = route[i + 1];
                if (this.distanceToSegment(x, y, a.x, a.y, b.x, b.y) < 38) {
                    return true;
                }
            }
        }

        return false;
    }

    distanceToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared === 0) {
            return Phaser.Math.Distance.Between(px, py, x1, y1);
        }
        let t =
            ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        return Phaser.Math.Distance.Between(
            px,
            py,
            x1 + t * dx,
            y1 + t * dy
        );
    }

    // PURCHASE VETERAN
   
purchaseVeteran(location) {

    if (this.gameOver) return;

    // Prioritize deploying reserve soldiers
    if (this.pendingSoldiers.length > 0) {

        this.deployNewGeneration(location);
        return;
    }

    if (location.occupied) return;

    const cost = 35;

    if (this.resources < cost) {

        this.showMessage("NOT ENOUGH ATP");
        return;
    }

    this.resources -= cost;

    location.occupied = true;

    if (location.pad && location.pad.active) {
        location.pad.destroy();
    }
    if (location.label && location.label.active) {
        location.label.destroy();
    }

    const tower = this.createVeteran(location.x, location.y, location);
    location.tower = tower;

    this.updateHUD();
}


    // CREATE VETERAN TOWER
    createVeteran(x, y, location) {

        const range = 145;
        const supportRange = 150;

        // Attack range visualization
        const rangeCircle = this.add.circle(
            x, y, range, 0x9c8b5b, 0.07
        );

        rangeCircle.setStrokeStyle(1, 0x9c8b5b, 0.2);

        // Visible veteran support aura
        const supportCircle = this.add.circle(
            x, y, supportRange, 0xe0c778, 0.06
        );
        supportCircle.setStrokeStyle(1, 0xffd86b, 0.75);
        supportCircle.setDepth(1);

        // Veteran body
        const body = this.add.circle(
            x, y, 17, 0x77706b
        );

        body.setStrokeStyle(3, 0xc4b59b);

        // Veteran symbol
        const symbol = this.add.text(
            x, y, "V",
            {
                fontSize: "16px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        const tower = {
            x: x,
            y: y,
            body: body,
            symbol: symbol,
            rangeCircle: rangeCircle,
            supportCircle: supportCircle,

            damage: 6,
            range: range,
            supportRange: supportRange,
            sellValue: Math.ceil(35 / 2),

            attackInterval: 900,
            attackCooldown: 0
        };

        this.towers.push(tower);

        this.showMessage("VETERAN DEPLOYED");
        if (location) {
            this.makeTowerReplaceable(location, tower);
        }
        return tower;
    }

    // CREATE ENEMY
    spawnEnemy() {

        if (this.gameOver) return;

        const spawnFromMiddle = Phaser.Math.Between(0, 3) === 0;
        let pathIndex;
        let enemyPath;
        let start;

        if (spawnFromMiddle) {
            start = this.middleDriveway[0];
            enemyPath = [
                ...this.middleDriveway,
                ...this.pathPoints.slice(this.midSpawnIndex)
            ];
            pathIndex = 1;
        } else {
            start = this.pathPoints[0];
            enemyPath = [...this.pathPoints];
            pathIndex = 1;
        }

        const body = this.add.circle(
            start.x,
            start.y,
            13,
            0x9e3030
        );

        body.setStrokeStyle(2, 0xd45a5a);

        const symbol = this.add.text(
            start.x,
            start.y,
            "X",
            {
                fontSize: "12px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        const enemy = {
            body: body,
            symbol: symbol,
            pathPoints: enemyPath,

            pathIndex: pathIndex,

            speed: 55 + this.wave * 7,

            health: 36 + (this.wave - 1) * 18,
            maxHealth: 36 + (this.wave - 1) * 18,
            damageToBase: 10,

            healthBar: this.add.graphics()
        };

        this.enemies.push(enemy);

        this.waveRemaining--;

        if (this.wave === 5 && this.waveRemaining === 0) {
            this.spawnDeath();
        }
    }

    spawnDeath() {

        if (this.deathSpawned) return;
        this.deathSpawned = true;

        const start = this.pathPoints[0];
        const body = this.add.circle(
            start.x,
            start.y,
            32,
            0x160d15
        );
        body.setStrokeStyle(5, 0xd45a5a);

        const symbol = this.add.text(
            start.x,
            start.y,
            "DEATH",
            {
                fontSize: "13px",
                color: "#ff7777",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        const boss = {
            body: body,
            symbol: symbol,
            pathPoints: [
                ...this.pathPoints
            ],
            pathIndex: 1,
            speed: 42,
            health: 600,
            maxHealth: 600,
            damageToBase: 40,
            isBoss: true,
            healthBar: this.add.graphics()
        };

        this.enemies.push(boss);
        this.showMessage("DEATH - FINAL BOSS");
    }

    // UPDATE ENEMY HEALTH BAR
    drawEnemyHealth(enemy) {

        const bar = enemy.healthBar;

        bar.clear();

        const width = enemy.isBoss ? 90 : 28;
        const height = enemy.isBoss ? 8 : 4;

        const x = enemy.body.x - width / 2;
        const y = enemy.body.y - 22;

        bar.fillStyle(0x333333, 1);
        bar.fillRect(x, y, width, height);

        bar.fillStyle(0xb83d3d, 1);

        bar.fillRect(
            x,
            y,
            width * Math.max(0, enemy.health / enemy.maxHealth),
            height
        );
    }

    // DAMAGE ENEMY
    damageEnemy(enemy, damage) {

        if (!enemy.body.active) return;

        enemy.health -= damage;

        if (enemy.health <= 0) {

            enemy.body.destroy();
            enemy.symbol.destroy();
            enemy.healthBar.destroy();

            this.enemies = this.enemies.filter(
                item => item !== enemy
            );

            this.resources += 15;
            if (enemy.isBoss) {
                this.resources += 100;
            }

            this.updateHUD();

        } else {

            this.drawEnemyHealth(enemy);
        }
    }

    // VETERAN ATTACK
    attackEnemy(tower, enemy, damage) {

        const bullet = this.add.circle(
            tower.x,
            tower.y,
            4,
            0xe1c17a
        );

        this.tweens.add({
            targets: bullet,

            x: enemy.body.x,
            y: enemy.body.y,

            duration: 150,

            onComplete: () => {

                bullet.destroy();

                if (enemy.body.active) {
                    this.damageEnemy(enemy, damage);
                }
            }
        });
    }

    // UPDATE HUD
    
updateHUD() {

    this.updateHQHealthBar();

    const surrogateStatus = this.surrogateOwned
        ? "ACQUIRED"
        : "NOT ACQUIRED";

    const wombStatus = this.wombOwned
        ? "ESTABLISHED"
        : "NOT ESTABLISHED";

    this.hudText.setText(
        "ATP: " + this.resources + "\n" +
        "WAVE: " + this.wave + " / 5\n\n" +
        "REPRODUCTIVE TECHNOLOGY\n" +
        "SURROGATE: " + surrogateStatus + "\n" +
        "ARTIFICIAL WOMB: " + wombStatus + "\n" +
        "RESERVE SOLDIERS: " + this.pendingSoldiers.length + "\n"
    );
}


    // DISPLAY MESSAGE
    showMessage(message) {

        const text = this.add.text(
            480,
            45,
            message,
            {
                fontSize: "16px",
                color: "#e1c17a",
                fontStyle: "bold",
                backgroundColor: "#222222",
                padding: {
                    x: 10,
                    y: 6
                }
            }
        ).setOrigin(0.5);

        this.time.delayedCall(1500, () => {
            text.destroy();
        });
    }

    // START WAVE
    startWave() {

        if (this.gameOver || this.wave >= 5) return;

        this.wave++;

        this.waveRemaining = 5 + (this.wave * 2);
        this.spawning = true;

        if (this.wave === 5) {
            this.showMessage("WAVE 5 - DEATH APPROACHES");
        } else {
            this.showMessage("WAVE " + this.wave);
        }

        this.updateHUD();

        this.time.addEvent({

            delay: 1000,

            repeat: this.waveRemaining - 1,

            callback: () => {
                this.spawnEnemy();
            },

            callbackScope: this
        });
    }

    // GAME OVER
    endVictory() {

        if (this.gameOver) return;
        this.gameOver = true;
        this.add.rectangle(480, 300, 960, 600, 0x000000, 0.8);
        this.add.text(480, 270, "HUMANITY ENDURES", {
            fontSize: "38px",
            color: "#79bb87",
            fontStyle: "bold"
        }).setOrigin(0.5);
        this.add.text(480, 330, "Death has fallen. The final wave is over.", {
            fontSize: "16px",
            color: "#ffffff"
        }).setOrigin(0.5);
    }

    endGame() {

        if (this.gameOver) return;

        this.gameOver = true;

        this.add.rectangle(
            480, 300, 960, 600, 0x000000, 0.8
        );

        this.add.text(
            480, 270,
            "HUMANITY HAS FALLEN",
            {
                fontSize: "38px",
                color: "#b52d2d",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.add.text(
            480, 330,
            "Death has claimed the last remnants of civilization.",
            {
                fontSize: "16px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);
    }

    // MAIN GAME LOOP
    update(time, delta) {

        if (this.gameOver) return;

        // MOVE ENEMIES
        for (let i = this.enemies.length - 1; i >= 0; i--) {

            const enemy = this.enemies[i];

            if (!enemy.body.active) continue;

            const target = enemy.pathPoints[enemy.pathIndex];

            const dx = target.x - enemy.body.x;
            const dy = target.y - enemy.body.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            const movement = enemy.speed * (delta / 1000);

            if (distance <= movement) {

                enemy.body.setPosition(target.x, target.y);
                enemy.symbol.setPosition(target.x, target.y);

                enemy.pathIndex++;

                if (enemy.pathIndex >= enemy.pathPoints.length) {

                    enemy.body.destroy();
                    enemy.symbol.destroy();
                    enemy.healthBar.destroy();

                    this.enemies.splice(i, 1);

                    this.baseHealth -= enemy.damageToBase || 10;

                    this.updateHUD();

                    if (this.baseHealth <= 0) {
                        this.endGame();
                        return;
                    }
                }

            } else {

                const moveX = (dx / distance) * movement;
                const moveY = (dy / distance) * movement;

                enemy.body.x += moveX;
                enemy.body.y += moveY;

                enemy.symbol.x += moveX;
                enemy.symbol.y += moveY;
            }

            if (enemy.body.active) {
                this.drawEnemyHealth(enemy);
            }
        }

        // TOWER ATTACKS
        for (const tower of this.towers) {

            tower.attackCooldown -= delta;

            if (tower.attackCooldown > 0) continue;

            
// FIND WEAKEST ENEMY IN RANGE (FOCUS FIRE)
let target = null;
let lowestHealth = Infinity;
let closestDistance = Infinity;

for (const enemy of this.enemies) {

    if (!enemy.body.active) continue;

    const distance = Phaser.Math.Distance.Between(
        tower.x,
        tower.y,
        enemy.body.x,
        enemy.body.y
    );

    // Only consider enemies within attack range
    if (distance > tower.range) continue;

    // Prioritize enemies with the lowest health
    if (
        enemy.health < lowestHealth ||
        (
            enemy.health === lowestHealth &&
            distance < closestDistance
        )
    ) {

        lowestHealth = enemy.health;
        closestDistance = distance;
        target = enemy;
    }
}


            if (target) {

                // CHECK FOR NEARBY VETERAN SUPPORT
                // Multiple veterans in range grant the same capped 25% boost.
                const supportedByVeteran = this.towers.some(other => {

                    if (other === tower) return false;
                    if (!other.supportRange) return false;

                    const distance = Phaser.Math.Distance.Between(
                        tower.x,
                        tower.y,
                        other.x,
                        other.y
                    );

                    return distance <= other.supportRange;
                });

                const damage = supportedByVeteran
                    ? tower.damage * 1.25
                    : tower.damage;

                this.attackEnemy(tower, target, damage);

                tower.attackCooldown = tower.attackInterval;
            }
        }

        // START NEXT WAVE
        if (
            this.spawning &&
            this.waveRemaining === 0 &&
            this.enemies.length === 0
        ) {

            this.spawning = false;

            if (this.wave >= 5) {
                this.endVictory();
                return;
            }

            this.time.delayedCall(3000, () => {

                if (!this.gameOver) {
                    this.startWave();
                }

            });
        }
    }
}

window.GameScene = GameScene;
