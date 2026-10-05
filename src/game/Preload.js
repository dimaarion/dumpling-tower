import Phaser from 'phaser';
export default class Preload extends Phaser.Scene {
    constructor() {
        super("Preload");
    }
    preload() {
        this.load.on("progress",(e)=>{
            console.log(e)
        })
    }

    create() {
        console.log("Preload");
        this.scene.start('main');
    }
}