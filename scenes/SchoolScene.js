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

export default class SchoolScene extends Scene {
  constructor() {
    super('SchoolScene')
  }

  preload() {
    super.preload()
    this.lia = this.maki.player('lia')
    try {
      manager.map(this, 'school_map')
    } catch (error) {
      console.warn('School map fallback:', error?.message ?? error)
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
      backdrop: 0x7b52c9,
      floor: 0xa57be5,
      grid: 0xf8efff,
      wall: 0x1a1229,
      sky: 0xc4a6ff,
      glow: 0xf4e8ff,
      sparkle: 0xfef8ff,
      horizon: 0x3f2d6a,
    })

    this.roomWalls = createRoomWalls(this, { wall: 0x140e1d })
    this.lia.sprite.setPosition(400, 430)
    this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'school_map') ?? this.roomWalls)

    this.ui.createInventoryBar(this)
    this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])

    this.add.text(400, 22, 'School - Conditions Puzzle', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f0ddff',
    }).setOrigin(0.5)

    this.doorLeft = this.add.rectangle(380, 222, 34, 92, 0x5b466f).setStrokeStyle(2, 0x120d1a, 1)
    this.doorRight = this.add.rectangle(420, 222, 34, 92, 0x5b466f).setStrokeStyle(2, 0x120d1a, 1)
    this.add.rectangle(400, 222, 72, 104, 0x2e233f, 0.22).setStrokeStyle(2, 0x120d1a, 1)
    this.doorGlow = this.add.rectangle(400, 222, 92, 118, 0xbd8cff, 0.24)

    this.npc = createPixelNpc(this, 400, 198, 0xb06eff, 'Rex')
    this.npc.setAlpha(0.98)

    this.dialogueLines = [
      'Hello? Is someone there? I\'m Teacher Rex. I\'m stuck inside.',
      'My door only opens with this condition: if (student === perfect)',
      'No student has ever been perfect, so the door never opens. Also I deleted the else block. It felt negative.',
      'An IF/ELSE statement handles TWO outcomes: what happens when true AND what happens when false. Both matter!',
      'Please fix my door condition so imperfect students can enter too. Including me. I need to leave.',
    ]

    this.spaceKey = this.input.keyboard.addKey('SPACE')
    this.spaceKey.on('down', () => {
      if (this.transitioning || this.registry.get('schoolFixed')) {
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
    return Math.hypot(this.lia.sprite.x - this.npc.x, this.lia.sprite.y - this.npc.y) <= 68
  }

  startDialogue() {
    this.ui.showDialogue('Rex', '#d39eff', this.dialogueLines, () => this.startPuzzle())
  }

  startPuzzle() {
    this.ui.showPuzzle({
      type: 'single-choice',
      title: 'Write the correct if/else condition',
      instructions: 'Choose the missing block that opens the door for everyone who is not perfect.',
      options: [
        { label: 'A) else { openDoor() }', correct: true },
        { label: 'B) else { lockDoor() }', correct: false, wrongMessage: 'That keeps the door locked. Rex is still trapped.' },
        { label: 'C) delete this block', correct: false, wrongMessage: 'That\'s what Rex did! The door is still locked. Rex is still inside. He\'s named the spider Fred.' },
        { label: 'D) if (student === "ok")', correct: false, wrongMessage: 'That only works for ok students. Rex is still trapped.' },
      ],
      successMessage: 'else { openDoor() } means: for everyone who isn\'t perfect — which is everyone — open the door!',
      onCorrect: () => this.completeSchool(),
    })
  }

  completeSchool() {
    this.ui.showDialogue('Rex', '#d39eff', [
      'FREEDOM. Thank you. I\'ve been in there 6 years. Fred the spider is coming with me.',
    ], () => {
      this.openDoorAnimation()
      markFixed(this, 'schoolFixed')
      addInventoryItem(this, { name: 'Chalk of Logic', emoji: '✏️', color: 0xd39eff })
      this.ui.showItemPickup('Chalk of Logic', '✏️')
      this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])
      this.time.delayedCall(1500, () => this.returnToHub())
    })
  }

  openDoorAnimation() {
    this.tweens.add({ targets: this.doorLeft, x: 345, duration: 700, ease: 'Cubic.easeOut' })
    this.tweens.add({ targets: this.doorRight, x: 455, duration: 700, ease: 'Cubic.easeOut' })
    this.tweens.add({ targets: this.doorGlow, alpha: 0.1, duration: 700 })
    this.tweens.add({ targets: this.npc, y: 176, duration: 700, ease: 'Cubic.easeOut' })
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
    if (this.registry.get('schoolFixed') || this.ui.dialogueActive || this.ui.puzzleActive) {
      this.ui.hideInteractHint()
      return
    }

    if (this.isNearNpc()) {
      this.ui.showInteractHint(this, this.npc.x, this.npc.y - 42, 'Press SPACE')
    } else {
      this.ui.hideInteractHint()
    }
  }
}
