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

function createCarrot(scene, x, y, scale = 1) {
  const group = scene.add.container(x, y)
  const body = scene.add.triangle(0, 2, -5 * scale, 10 * scale, 0, -10 * scale, 5 * scale, 10 * scale, 0xff9c33)
  const leafLeft = scene.add.triangle(-2 * scale, -10 * scale, -8 * scale, -15 * scale, -2 * scale, -4 * scale, 0xffe88c)
  const leafRight = scene.add.triangle(2 * scale, -10 * scale, 2 * scale, -4 * scale, 8 * scale, -15 * scale, 0x8ce07a)
  group.add([body, leafLeft, leafRight])
  return group
}

export default class FarmScene extends Scene {
  constructor() {
    super('FarmScene')
  }

  preload() {
    super.preload()
    this.lia = this.maki.player('lia')
    try {
      manager.map(this, 'farm_map')
    } catch (error) {
      console.warn('Farm map fallback:', error?.message ?? error)
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
      backdrop: 0x3a7f41,
      floor: 0x79b86f,
      grid: 0xf1ffe9,
      wall: 0x17261b,
      sky: 0xbceaa9,
      glow: 0xf4ffbf,
      sparkle: 0xeaffea,
      horizon: 0x2d5a34,
    })

    this.roomWalls = createRoomWalls(this, { wall: 0x111d16 })
    this.lia.sprite.setPosition(400, 430)
    this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'farm_map') ?? this.roomWalls)

    this.ui.createInventoryBar(this)
    this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])

    this.add.text(400, 22, 'Farm - Loop Puzzle', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#dcffe0',
    }).setOrigin(0.5)

    this.npc = createPixelNpc(this, 240, 160, 0x4ec16f, 'Bob')

    for (let i = 0; i < 40; i += 1) {
      const x = 175 + ((i * 53) % 320)
      const y = 90 + ((i * 31) % 250)
      createCarrot(this, x, y, 0.8 + ((i % 4) * 0.05))
    }

    this.dialogueLines = [
      'HELP. I am Farmer Bob and I cannot stop planting carrots.',
      'I wrote a loop to plant 5 rows of carrots but I forgot to tell it when to STOP.',
      'Now it\'s been running for 3 days. I have 40,000 carrots. My family has left me.',
      'A LOOP repeats actions. But every loop needs a stop condition — or it runs FOREVER!',
      'Please fix my planting machine before I drown in carrots. Also I found carrot #40,001. It\'s beautiful.',
    ]

    this.spaceKey = this.input.keyboard.addKey('SPACE')
    this.spaceKey.on('down', () => {
      if (this.transitioning || this.registry.get('farmFixed')) {
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
    this.ui.showDialogue('Bob', '#76ff8c', this.dialogueLines, () => this.startPuzzle())
  }

  startPuzzle() {
    this.ui.showPuzzle({
      type: 'single-choice',
      title: 'Add a stop condition to the loop',
      instructions: 'Choose the condition that stops the loop after 5 rows.',
      options: [
        { label: 'A) row > 0', correct: false, wrongMessage: 'The loop never runs! Bob has 0 carrots. He\'s confused.' },
        { label: 'B) row < 5', correct: true },
        { label: 'C) true', correct: false, wrongMessage: 'That\'s an infinite loop! Bob now has 80,000 carrots. The village is buried.' },
        { label: 'D) row === 100', correct: false, wrongMessage: 'Bob now has 100 rows. He\'s crying but the carrots smell amazing.' },
      ],
      successMessage: 'row < 5 means: keep going while row is less than 5. Stop at 5. Perfect loop!',
      onCorrect: () => this.completeFarm(),
    })
  }

  completeFarm() {
    this.ui.showDialogue('Bob', '#76ff8c', [
      'Oh thank goodness. The carrots stopped. I found carrot #40,001 and I\'m keeping it as a trophy.',
    ], () => {
      markFixed(this, 'farmFixed')
      addInventoryItem(this, { name: 'Golden Carrot Trophy', emoji: '🥕', color: 0x76ff8c })
      this.ui.showItemPickup('Golden Carrot Trophy', '🥕')
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
    if (this.registry.get('farmFixed') || this.ui.dialogueActive || this.ui.puzzleActive) {
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
