import Phaser from 'phaser'
import HubScene from './scenes/HubScene.js'
import LibraryScene from './scenes/LibraryScene.js'
import FarmScene from './scenes/FarmScene.js'
import MarketScene from './scenes/MarketScene.js'
import SchoolScene from './scenes/SchoolScene.js'
import MayorScene from './scenes/MayorScene.js'

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  transparent: true,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [HubScene, LibraryScene, FarmScene, MarketScene, SchoolScene, MayorScene],
})
