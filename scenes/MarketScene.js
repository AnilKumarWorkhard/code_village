import { Scene, manager } from '@tialops/maki'
import UIManager from './UIManager.js'
import {
  addInventoryItem,
  createPixelNpc,
  createRoomWalls,
  createSceneBackdrop,
  ensureRegistryDefaults,
  markFixed,
  enableWASDMovement,
  setupWorldView,
} from './SceneUtils.js'

export default class MarketScene extends Scene {
  constructor() {
    super('MarketScene')
  }

  preload() {
    super.preload()
    this.lia = this.maki.player('lia')
    try {
      manager.map(this, 'market_map')
    } catch (error) {
      console.warn('Market map fallback:', error?.message ?? error)
    }
    manager.preload(this)
  }

  create() {
    super.create()
    ensureRegistryDefaults(this)
    this.ui = new UIManager(this)
    manager.create(this)
    enableWASDMovement(this, this.lia)
    this.cameras.main.fadeIn(300, 0, 0, 0)
    setupWorldView(this, 480, 480, this.lia.sprite)
    createSceneBackdrop(this, {
      backdrop: 0xd06d31,
      floor: 0xe29a61,
      grid: 0xfff0df,
      wall: 0x211711,
      sky: 0xffc98b,
      glow: 0xfff0d0,
      sparkle: 0xfff7ef,
      horizon: 0x6a3c2a,
    })

    this.roomWalls = createRoomWalls(this, { wall: 0x160f0b })
    this.lia.sprite.setPosition(400, 430)
    this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'market_map') ?? this.roomWalls)

    this.ui.createInventoryBar(this)
    this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])

    this.add.text(400, 22, 'Market - Variables Puzzle', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffe6cc',
    }).setOrigin(0.5)

    this.npc = createPixelNpc(this, 240, 160, 0xffa23d, 'Meg')

    const signs = [
      [130, 90, 'price'],
      [640, 95, 'price2'],
      [200, 250, 'priceFINAL'],
      [575, 250, 'price'],
      [405, 110, 'price2'],
      [410, 330, 'priceFINAL'],
    ]
    signs.forEach(([x, y, label]) => {
      this.add.text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffe0ad',
        backgroundColor: '#2e1f15aa',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5)
    })

    this.dialogueLines = [
      "Welcome to my shop! Everything costs 'price' gold. ...What is 'price'? Great question.",
      "I used the same variable name for everything. Apple = price. Sword = price. Potion = price.",
      "Then I changed 'price' to 999 for the sword and now apples cost 999 gold. Nobody buys apples.",
      'VARIABLES are named containers for values. Each item needs its OWN variable name!',
      "Help me fix my price board before the apple farmer comes back. He's very angry.",
    ]

    this.spaceKey = this.input.keyboard.addKey('SPACE')
    this.spaceKey.on('down', () => {
      if (this.transitioning || this.registry.get('marketFixed')) {
        return
      }
      if (this.ui.dialogueActive || this.ui.puzzleActive) {
        return
      }
      if (this.isNearNpc()) {
        this.startDialogue()
      }
    })

    this.input.keyboard.on('keydown-Y', () => this.returnToHub())
  }

  isNearNpc() {
    return Math.hypot(this.lia.sprite.x - this.npc.x, this.lia.sprite.y - this.npc.y) <= 60
  }

  startDialogue() {
    this.ui.showDialogue('Meg', '#ffb04f', this.dialogueLines, () => this.startPuzzle())
  }

  startPuzzle() {
    this.ui.showPuzzle({
      type: 'matching',
      title: 'Name the Variables Correctly',
      instructions: 'Click an item on the left, then click the correct variable name on the right.',
      items: [
        { label: 'Apple', emoji: '🍎', match: 'applePrice' },
        { label: 'Sword', emoji: '⚔️', match: 'swordPrice' },
        { label: 'Potion', emoji: '🧪', match: 'potionPrice' },
        { label: 'Map', emoji: '🗺️', match: 'mapPrice' },
      ],
      names: ['applePrice', 'swordPrice', 'potionPrice', 'mapPrice', 'price', 'price2', 'theThing', 'x'],
      wrongMessage: 'That name does not belong to that item. Try again!',
      onCorrect: () => this.completeMarket(),
    })
  }

  completeMarket() {
    this.ui.showDialogue('Meg', '#ffb04f', [
      'The prices make sense now! The apple farmer just arrived. Tell him nothing happened.',
    ], () => {
      markFixed(this, 'marketFixed')
      addInventoryItem(this, { name: 'Price Tag Collection', emoji: '🏷️', color: 0xffb04f })
      this.ui.showItemPickup('Price Tag Collection', '🏷️')
      this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])
      this.time.delayedCall(1500, () => this.returnToHub())
    })
  }

  returnToHub() {
    if (this.transitioning) {
      return
    }
    this.transitioning = true
    this.ui.hideDialogue()
    this.ui.hidePuzzle()
    this.ui.fadeToScene(this, 'HubScene', 300)
  }

  update() {
    this.maki.move(this.lia)
    if (this.registry.get('marketFixed') || this.ui.dialogueActive || this.ui.puzzleActive) {
      this.ui.hideInteractHint()
      return
    }

    if (this.isNearNpc()) {
      this.ui.showInteractHint(this, this.npc.x, this.npc.y - 36, 'Press SPACE')
    } else {
      this.ui.hideInteractHint()
    }
  }
}
