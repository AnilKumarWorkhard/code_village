import { Scene, manager } from '@tialops/maki'
import UIManager from './UIManager.js'
import {
  createPixelNpc,
  createRoomWalls,
  createSceneBackdrop,
  ensureRegistryDefaults,
  enableWASDMovement,
  resetProgress,
  setupWorldView,
} from './SceneUtils.js'

export default class MayorScene extends Scene {
  constructor() {
    super('MayorScene')
  }

  preload() {
    super.preload()
    this.lia = this.maki.player('lia')
    try {
      manager.map(this, 'mayor_map')
    } catch (error) {
      console.warn('Mayor map fallback:', error?.message ?? error)
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
    setupWorldView(this, 320, 320, this.lia.sprite)

    if (!this.registry.get('allFixed')) {
      this.scene.start('HubScene')
      return
    }

    createSceneBackdrop(this, {
      backdrop: 0xb48a36,
      floor: 0xd0ad62,
      grid: 0xfff6d9,
      wall: 0x20180f,
      sky: 0xffe39f,
      glow: 0xfff5db,
      sparkle: 0xfff8e7,
      horizon: 0x665028,
    })

    this.roomWalls = createRoomWalls(this, { wall: 0x17120b })
    this.lia.sprite.setPosition(280, 240)
    this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'mayor_map') ?? this.roomWalls)

    this.ui.createInventoryBar(this)
    this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])

    this.add.text(400, 22, 'Mayor\'s Office - Final Reveal', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fff1b8',
    }).setOrigin(0.5)

    this.officeDesk = this.add.rectangle(400, 300, 220, 80, 0x8c6a3d).setStrokeStyle(3, 0x271a0b, 1)
    this.officeLamp = this.add.rectangle(400, 220, 30, 50, 0xffe38b, 0.4)
    this.officeLampGlow = this.add.circle(400, 220, 44, 0xffe38b, 0.24)
    this.npc = createPixelNpc(this, 160, 128, 0xf1d15a, 'Gerald')

    this.dialogueLines = [
      'Ah, the Code Hero! You\'ve fixed the entire village. I am Mayor Gerald. Welcome to my office.',
      'The Library\'s sequence is restored. The Farm loop has a stop condition. The Market has proper variables.',
      'And poor Rex is finally free from the school. Though he\'s brought the spider, which I\'m less thrilled about.',
      'But I owe you a confession. The crash that broke everything... it was my fault.',
      'I wrote the village\'s main program. I checked it 100 times. It was perfect.',
      '...except I forgot a semicolon. One semicolon. At the end of line 47.',
      'The entire village broke because of a missing semicolon. I have been the Mayor for 20 years.',
    ]

    this.spaceKey = this.input.keyboard.addKey('SPACE')
    this.spaceKey.on('down', () => {
      if (this.ui.dialogueActive || this.ui.puzzleActive) {
        return
      }
      if (!this.sequenceStarted && this.isNearNpc()) {
        this.startDialogue()
      }
    })

    this.input.keyboard.on('keydown-R', () => {
      if (this.endingComplete) {
        resetProgress(this)
        this.scene.start('HubScene')
      }
    })
  }

  isNearNpc() {
    return Math.hypot(this.lia.sprite.x - this.npc.x, this.lia.sprite.y - this.npc.y) <= 70
  }

  startDialogue() {
    this.sequenceStarted = true
    this.ui.showDialogue('Gerald', '#ffe477', this.dialogueLines, () => this.startEndingSequence())
  }

  startEndingSequence() {
    this.ui.hideDialogue()
    this.buildEndingOverlay()
    this.playPhaseOne()
  }

  buildEndingOverlay() {
    const { width, height } = this.scale
    this.endingGroup = this.add.container(0, 0)
    this.endingGroup.setScrollFactor(0)
    this.endingGroup.setDepth(8000)

    this.endingBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1)
    this.endingGroup.add(this.endingBg)
  }

  clearEndingOverlay() {
    this.endingDecorations?.forEach((entry) => entry.destroy())
    this.endingDecorations = []
    this.endingGroup?.destroy()
    this.endingGroup = null
    this.endingBg = null
    this.endingText?.destroy()
    this.endingText = null
  }

  showCenteredText(lines, color = '#ffffff', size = 22) {
    this.endingText?.destroy()
    this.endingText = this.add.text(this.scale.width / 2, this.scale.height / 2, lines, {
      fontFamily: 'monospace',
      fontSize: `${size}px`,
      color,
      align: 'center',
      lineSpacing: 12,
      wordWrap: { width: 680 },
    }).setOrigin(0.5)
    this.endingText.setScrollFactor(0)
    this.endingText.setDepth(8100)
    this.endingDecorations = this.endingDecorations ?? []
    this.endingDecorations.push(this.endingText)
  }

  playPhaseOne() {
    this.clearEndingOverlay()
    this.buildEndingOverlay()
    this.showCenteredText('The village was saved.\n\nBy a hero who understood sequences, loops, variables, and conditions.', '#f8f8f8', 24)
    this.time.delayedCall(3000, () => this.playPhaseTwo())
  }

  playPhaseTwo() {
    this.clearEndingOverlay()
    this.buildEndingOverlay()
    this.showCenteredText("But the Mayor's semicolon remains missing.\n\nHe has added it to the village coat of arms.\n\nAs a warning.", '#fff0c0', 24)
    this.time.delayedCall(3000, () => this.playPhaseThree())
  }

  playPhaseThree() {
    this.clearEndingOverlay()
    this.buildEndingOverlay()
    this.drawRestoredVillage()
    this.showCenteredText('Code Village — population: 5 NPCs, 1 spider named Fred,\nand a carrot trophy.', '#f6ffd8', 22)
    this.time.delayedCall(4000, () => this.playCredits())
  }

  drawRestoredVillage() {
    const { width, height } = this.scale
    this.endingDecorations = this.endingDecorations ?? []
    const ground = this.add.rectangle(width / 2, height / 2, width, height, 0x1a281f, 1)
    const sun = this.add.circle(660, 90, 36, 0xffe48a, 1)
    this.endingDecorations.push(ground, sun)
    const houses = [
      [210, 290, 90, 64, 0x5c8bd6],
      [370, 270, 98, 70, 0x7bc96a],
      [530, 295, 92, 66, 0xffab4e],
    ]
    houses.forEach(([x, y, w, h, color]) => {
      const body = this.add.rectangle(x, y, w, h, color).setStrokeStyle(2, 0x111111, 1)
      const roof = this.add.triangle(x, y - h / 2 - 4, x - w / 2 - 8, y - 10, x, y - h / 2 - 36, x + w / 2 + 8, y - 10, color)
      this.endingDecorations.push(body, roof)
    })
    const mayorHouse = this.add.rectangle(640, 320, 150, 90, 0xf2d15d).setStrokeStyle(2, 0x111111, 1)
    const mayorLabel = this.add.text(640, 322, 'Mayor\'s\nHouse', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4d3c10',
      align: 'center',
    }).setOrigin(0.5)
    this.endingDecorations.push(mayorHouse, mayorLabel)
    const fredLabel = this.add.text(125, 420, 'Fred the spider', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d9d9d9',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    })
    const trophyLabel = this.add.text(290, 410, 'Carrot trophy', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffd77b',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    })
    const restoredLabel = this.add.text(400, 150, 'Restored village', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#eaffd5',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5)
    this.endingDecorations.push(fredLabel, trophyLabel, restoredLabel)
    this.tweens.add({
      targets: [sun],
      alpha: { from: 0.7, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    })
    const fredBody = this.add.circle(115, 390, 10, 0x4b2e1a, 1)
    const fredEye1 = this.add.circle(108, 384, 3, 0xffffff, 1)
    const fredEye2 = this.add.circle(122, 384, 3, 0xffffff, 1)
    this.endingDecorations.push(fredBody, fredEye1, fredEye2)
  }

  playCredits() {
    this.clearEndingOverlay()
    this.buildEndingOverlay()

    const credits = [
      'Code Village',
      'Built with the Maki Framework',
      '',
      'CAST:',
      'Lia — The Code Hero',
      'Zara — The Librarian',
      'Bob — The Farmer (and his 40,001 carrots)',
      'Meg — The Shopkeeper',
      'Rex — The Teacher (6 years, 0 windows)',
      'Gerald — The Mayor (20 years, 1 semicolon)',
      'Fred — The Spider',
      '',
      'CONCEPTS TAUGHT:',
      'Sequences · Loops · Variables · Conditions',
      '',
      'Thank you for playing!',
      '',
      '// TODO: fix the semicolon on line 47',
    ]

    const text = this.add.text(this.scale.width / 2, this.scale.height + 40, credits.join('\n'), {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f8f8f8',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5, 0)
    text.setScrollFactor(0)
    text.setDepth(8100)
    this.endingDecorations = this.endingDecorations ?? []
    this.endingDecorations.push(text)

    this.tweens.add({
      targets: text,
      y: -text.height - 120,
      duration: 8000,
      ease: 'Linear',
      onComplete: () => this.showRestartPrompt(),
    })
  }

  showRestartPrompt() {
    this.clearEndingOverlay()
    this.buildEndingOverlay()
    this.showCenteredText('Credits complete.\n\nPress R to play again.', '#ffffff', 26)
    this.endingComplete = true
  }

  update() {
    this.maki.move(this.lia)
    if (this.ui.dialogueActive || this.ui.puzzleActive) {
      this.ui.hideInteractHint()
      return
    }

    if (!this.sequenceStarted && this.isNearNpc()) {
      this.ui.showInteractHint(this, this.npc.x, this.npc.y - 42, 'Press SPACE')
    } else {
      this.ui.hideInteractHint()
    }
  }
}
