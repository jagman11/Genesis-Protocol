class TitleScene extends Phaser.Scene {

    constructor() {
        super("TitleScene");
    }

    create() {

        this.cameras.main.setBackgroundColor("#151518");

        this.add.text(480, 45, "GENESIS PROTOCOL", {
            fontSize: "34px",
            color: "#b84a4a",
            fontStyle: "bold",
            letterSpacing: 5
        }).setOrigin(0.5);

        this.add.text(480, 82, "HOW TO PLAY", {
            fontSize: "16px",
            color: "#aaaaaa",
            letterSpacing: 3
        }).setOrigin(0.5);

        this.add.rectangle(480, 315, 840, 410, 0x202124, 0.96)
            .setStrokeStyle(2, 0x54383e);

        this.add.text(80, 145,
            "TOWER TYPES",
            {
                fontSize: "17px",
                color: "#d6b56a",
                fontStyle: "bold"
            }
        );

        this.add.text(80, 170,
            "VETERAN - 35 ATP | Ranged defender; grants nearby troops +25% damage.",
            {
                fontSize: "13px",
                color: "#ffffff",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 195,
            "NEW-GENERATION SOLDIER - produced by Genesis for 75 ATP.",
            {
                fontSize: "13px",
                color: "#ffffff",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 220,
            "Grade 1 / 2 / 3 / 4 strength increases with segregation accuracy.",
            {
                fontSize: "13px",
                color: "#a5c8df",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 255,
            "DEPLOYMENT & SELLING",
            {
                fontSize: "17px",
                color: "#d6b56a",
                fontStyle: "bold"
            }
        );

        this.add.text(80, 280,
            "Left-click any open grid space to deploy a Veteran. Left-click an existing tower to replace it with an available reserve soldier.",
            {
                fontSize: "13px",
                color: "#ffffff",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 305,
            "Right-click a deployed tower to sell it for half its purchase value. Replacing a tower also refunds half the old tower's cost.",
            {
                fontSize: "13px",
                color: "#ffffff",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 340,
            "REPRODUCTION",
            {
                fontSize: "17px",
                color: "#d6b56a",
                fontStyle: "bold"
            }
        );

        this.add.text(80, 365,
            "Buy a Surrogate (35 ATP) or Artificial Womb (150 ATP), then initiate Genesis.",
            {
                fontSize: "13px",
                color: "#ffffff",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 390,
            "In the chromosome minigame, click each homolog to split the pairs across two cells.",
            {
                fontSize: "13px",
                color: "#ffffff",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 415,
            "0 correct pairs creates no soldier. 1-3 produces weaker soldiers. 4/4 produces a full-power soldier.",
            {
                fontSize: "13px",
                color: "#a5c8df",
                wordWrap: { width: 800 }
            }
        );

        this.add.text(80, 450,
            "Survive five increasingly difficult enemy waves. Enemies enter from the beginning or travel down a short middle driveway before joining one long winding path, with Death arriving in Wave 5.",
            {
                fontSize: "13px",
                color: "#aaaaaa",
                wordWrap: { width: 800 }
            }
        );

        const startButton = this.add.rectangle(480, 505, 220, 52, 0x762e35)
            .setStrokeStyle(2, 0xc65b5b)
            .setInteractive({ useHandCursor: true });

        this.add.text(480, 505, "BEGIN DEFENSE", {
            fontSize: "16px",
            color: "#ffffff",
            fontStyle: "bold",
            letterSpacing: 1
        }).setOrigin(0.5);

        startButton.on("pointerover", () => {
            startButton.setFillStyle(0xa33b44);
        });

        startButton.on("pointerout", () => {
            startButton.setFillStyle(0x762e35);
        });

        startButton.on("pointerdown", () => {
            this.scene.start("GameScene");
        });
    }
}

window.TitleScene = TitleScene;
