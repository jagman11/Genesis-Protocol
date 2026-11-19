
class ReproductionScene extends Phaser.Scene {

    constructor() {
        super("ReproductionScene");

        this.pairs = [];
    }

    create() {

        this.cameras.main.setBackgroundColor("#151518");
        this.pairs = [];

        // TITLE
        this.add.text(
            480, 45,
            "GENESIS PROTOCOL",
            {
                fontSize: "30px",
                color: "#b84a4a",
                fontStyle: "bold",
                letterSpacing: 4
            }
        ).setOrigin(0.5);

        this.add.text(
            480, 90,
            "CHROMOSOME SEGREGATION",
            {
                fontSize: "16px",
                color: "#aaaaaa",
                letterSpacing: 2
            }
        ).setOrigin(0.5);

        // INSTRUCTIONS
        this.add.text(
            480, 135,
            "Assign one homolog from each pair to each resulting cell.",
            {
                fontSize: "15px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        // CELL HEADERS
        this.add.text(350, 180, "HOMOLOG A", {
            fontSize: "17px",
            color: "#d5d5d5",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.add.text(610, 180, "HOMOLOG B", {
            fontSize: "17px",
            color: "#d5d5d5",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.add.text(
            480, 210,
            "CLICK EACH CHROMOSOME TO CHANGE ITS DESTINATION",
            {
                fontSize: "11px",
                color: "#888888"
            }
        ).setOrigin(0.5);

        // CREATE FOUR HOMOLOGOUS PAIRS
        for (let i = 0; i < 4; i++) {

            const y = 260 + (i * 75);

            // Random starting assignment
            const firstSide = Phaser.Math.Between(0, 1);
            const secondSide = Phaser.Math.Between(0, 1);

            const pair = {
                number: i + 1,
                homologs: [
                    {
                        name: "A",
                        side: firstSide,
                        box: null,
                        text: null
                    },
                    {
                        name: "B",
                        side: secondSide,
                        box: null,
                        text: null
                    }
                ]
            };

            this.pairs.push(pair);

            // PAIR LABEL
            this.add.text(
                90, y,
                "PAIR " + (i + 1),
                {
                    fontSize: "13px",
                    color: "#aaaaaa"
                }
            ).setOrigin(0, 0.5);

            // CREATE TWO CHROMOSOMES
            pair.homologs.forEach((homolog, index) => {

                const x = index === 0 ? 350 : 610;

                const container = this.add.rectangle(
                    x, y, 170, 48,
                    0x36363d
                );

                container.setStrokeStyle(
                    2,
                    homolog.side === 0
                        ? 0x80a9d0
                        : 0xc18bd0
                );

                container.setInteractive({
                    useHandCursor: true
                });

                const label = this.add.text(
                    x, y,
                    "HOMOLOG " + homolog.name,
                    {
                        fontSize: "13px",
                        color: "#ffffff",
                        fontStyle: "bold"
                    }
                ).setOrigin(0.5);

                homolog.box = container;
                homolog.text = label;

                container.on("pointerdown", () => {

                    homolog.side = homolog.side === 0 ? 1 : 0;

                    this.updateChromosome(homolog);

                });

                container.on("pointerover", () => {
                    container.setAlpha(0.7);
                });

                container.on("pointerout", () => {
                    container.setAlpha(1);
                });

                this.updateChromosome(homolog);
            });
        }

        // SUBMIT BUTTON
        const submit = this.add.rectangle(
            480, 590, 240, 55,
            0x762e35
        );

        submit.setStrokeStyle(2, 0xc65b5b);

        submit.setInteractive({
            useHandCursor: true
        });

        this.add.text(
            480, 590,
            "COMPLETE SEGREGATION",
            {
                fontSize: "15px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        submit.on("pointerover", () => {
            submit.setFillStyle(0xa33b44);
        });

        submit.on("pointerout", () => {
            submit.setFillStyle(0x762e35);
        });

        submit.on("pointerdown", () => {
            this.checkSegregation();
        });

    }

    // UPDATE CHROMOSOME APPEARANCE
    updateChromosome(homolog) {

        if (homolog.side === 0) {

            homolog.box.setFillStyle(0x30465b);
            homolog.box.setStrokeStyle(2, 0x80a9d0);

        } else {

            homolog.box.setFillStyle(0x503653);
            homolog.box.setStrokeStyle(2, 0xc18bd0);

        }

        homolog.text.setText(
    "HOMOLOG " + homolog.name +
    "\n→ CELL " + (homolog.side === 0 ? "A" : "B")
);

    }

    // CHECK SEGREGATION
    checkSegregation() {

        let correctPairs = 0;

        for (const pair of this.pairs) {

            const first = pair.homologs[0].side;
            const second = pair.homologs[1].side;

            if (first !== second) {
                correctPairs++;
            }
        }

        const success = correctPairs === this.pairs.length;

        // END MINIGAME
        this.showResult(success, correctPairs);
    }

    // DISPLAY RESULT
    showResult(success, score) {

        this.add.rectangle(
            480, 390, 500, 220,
            0x111114, 0.97
        ).setStrokeStyle(2, 0x777777);

        this.add.text(
            480, 330,
            success
                ? "SEGREGATION SUCCESSFUL"
                : "SEGREGATION ERROR",
            {
                fontSize: "23px",
                color: success ? "#79bb87" : "#d66a6a",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        this.add.text(
            480, 385,
            score + " / 4 chromosome pairs correctly segregated",
            {
                fontSize: "16px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        const offspringMessage = score === 4
            ? "Full-power soldier produced."
            : score === 3
                ? "Strong soldier produced, but slightly less powerful."
                : score === 2
                    ? "Moderate soldier produced with reduced power."
                    : score === 1
                        ? "Weak soldier produced with greatly reduced power."
                        : "No viable soldier produced.";

        this.add.text(
            480, 435,
            offspringMessage,
            {
                fontSize: "13px",
                color: score === 4 ? "#79bb87" : "#d6b56a",
                align: "center",
                wordWrap: { width: 450 }
            }
        ).setOrigin(0.5);

        const button = this.add.rectangle(
            480, 480, 190, 42,
            0x493d4f
        );

        button.setInteractive({
            useHandCursor: true
        });

        this.add.text(
            480, 480,
            "CONTINUE",
            {
                fontSize: "14px",
                color: "#ffffff",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        button.on("pointerdown", () => {

            const gameScene = this.scene.get("GameScene");

            gameScene.finishReproduction(success, score);

            this.scene.stop();

            this.scene.resume("GameScene");

        });

    }

}

window.ReproductionScene = ReproductionScene;
