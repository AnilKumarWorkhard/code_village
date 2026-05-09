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

export default class LibraryScene extends Scene {
  constructor() {
    super('LibraryScene')
  }

  preload() {
    super.preload()
    this.lia = this.maki.player('lia')
    try {
      manager.map(this, 'library_map')
    } catch (error) {
      console.warn('Library map fallback:', error?.message ?? error)
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
      backdrop: 0x406fc4,
      floor: 0x7898cf,
      grid: 0xf2f7ff,
      wall: 0x101827,
      sky: 0xa9c9ff,
      glow: 0xdcecff,
      sparkle: 0xffffff,
      horizon: 0x28406f,
    })

    this.roomWalls = createRoomWalls(this, { wall: 0x0f1724 })
    this.lia.sprite.setPosition(400, 430)
    this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'library_map') ?? this.roomWalls)

    this.ui.createInventoryBar(this)
    this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])

    this.add.rectangle(400, 72, 470, 18, 0x9cc5ff, 0.32)
    this.add.rectangle(400, 534, 470, 18, 0x9cc5ff, 0.32)
    this.add.rectangle(160, 300, 18, 460, 0x9cc5ff, 0.32)
    this.add.rectangle(640, 300, 18, 460, 0x9cc5ff, 0.32)

    this.npc = createPixelNpc(this, 240, 160, 0x3d7fe8, 'Zara')
    this.add.text(400, 22, 'Library - Sequence Puzzle', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#d4e7ff',
    }).setOrigin(0.5)

    this.dialogueLines = [
      'Oh thank goodness you\'re here! I\'m Zara, the librarian.',
      'Something terrible happened. All the book chapters got shuffled in the wrong order!',
      'The story now goes: Ending → Middle → Beginning. It makes NO sense.',
      'In coding, a SEQUENCE means steps must happen in the correct order. First things first!',
      'Can you help me put the story back in order? Please, the readers are very confused.',
    ]

    this.input.keyboard.on('keydown-Y', () => this.returnToHub())

    this.spaceKey = this.input.keyboard.addKey('SPACE')
    this.spaceKey.on('down', () => {
      if (this.transitioning || this.registry.get('libraryFixed')) {
        return
      }
      if (this.ui.dialogueActive || this.ui.puzzleActive) {
        return
      }
      if (this.isNearNpc()) {
        this.startDialogue()
      }
    })
  }

  isNearNpc() {
    const dx = this.lia.sprite.x - this.npc.x
    const dy = this.lia.sprite.y - this.npc.y
    return Math.hypot(dx, dy) <= 60
  }

  startDialogue() {
    this.ui.showDialogue('Zara', '#5da4ff', this.dialogueLines, () => {
      this.startPuzzle()
    })
  }

  startPuzzle() {
    this.ui.showPuzzle({
      type: 'sequence',
      title: 'Arrange the story in the correct sequence',
      instructions: 'Click the steps in the correct order: 1st, 2nd, 3rd',
      options: [
        { label: 'The hero defeats the dragon' },
        { label: 'The hero finds a map' },
        { label: 'The hero starts the journey' },
      ],
      sequence: [
        'The hero starts the journey',
        'The hero finds a map',
        'The hero defeats the dragon',
      ],
      successMessage: 'Perfect! A sequence is like a recipe — order always matters!',
      wrongMessage: 'The order is scrambled. Try again!',
      onCorrect: () => this.completeLibrary(),
    })
  }

  completeLibrary() {
    this.ui.showDialogue('Zara', '#5da4ff', [
      'You did it! The books make sense again. You\'re a true Code Hero! Here, take this Sequence Scroll.',
    ], () => {
      markFixed(this, 'libraryFixed')
      addInventoryItem(this, { name: 'Sequence Scroll', emoji: '📜', color: 0x5da4ff })
      this.ui.showItemPickup('Sequence Scroll', '📜')
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
    if (this.registry.get('libraryFixed') || this.ui.dialogueActive || this.ui.puzzleActive) {
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
