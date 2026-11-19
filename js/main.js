
const config = {
    type: Phaser.AUTO,

    width: 960,
    height: 600,

    parent: "game",

    backgroundColor: "#202124",

    scene: [TitleScene, GameScene, ReproductionScene],

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

window.game = new Phaser.Game(config);
