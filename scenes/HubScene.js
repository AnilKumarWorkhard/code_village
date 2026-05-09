import { Scene, manager } from '@tialops/maki'
import UIManager from './UIManager.js'
import {
  addAmbientMotion,
  addVillageLights,
  createSceneBackdrop,
  createRoomWalls,
  ensureRegistryDefaults,
  getRestoredCount,
  createSparkles,
  enableWASDMovement,
  setupWorldView,
} from './SceneUtils.js'

function drawBuilding(scene, config) {
  const group = scene.add.container(config.x, config.y)
  const body = scene.add.rectangle(0, 10, config.width, config.height, config.bodyColor)
  body.setStrokeStyle(3, 0x111522, 1)
  const roof = scene.add.triangle(0, -config.height / 2 + 8, -config.width / 2 - 6, 18, 0, -24, config.width / 2 + 6, 18, config.roofColor)
  roof.setStrokeStyle(2, 0x111522, 1)
  const windowLeft = scene.add.rectangle(-22, -2, 18, 18, 0xe2f4ff, 0.88)
  windowLeft.setStrokeStyle(2, 0x10131d, 1)
  const windowRight = scene.add.rectangle(22, -2, 18, 18, 0xe2f4ff, 0.88)
  windowRight.setStrokeStyle(2, 0x10131d, 1)
  const door = scene.add.rectangle(0, 36, 20, 26, config.doorColor)
  door.setStrokeStyle(2, 0x10131d, 1)
  const glow = scene.add.rectangle(0, 36, 32, 38, config.glowColor, 0.35)
  group.add([body, roof, windowLeft, windowRight, glow, door])
  const label = scene.add.text(0, -54, config.label, {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#ffffff',
    backgroundColor: '#00000088',
    padding: { x: 6, y: 3 },
  }).setOrigin(0.5)
  group.add(label)
  return { group, door, glow }
}

function updateDoorGlow(scene, glow, state) {
  glow.setFillStyle(state.color, state.alpha)
  scene.tweens.killTweensOf(glow)
  if (state.pulse) {
    scene.tweens.add({
      targets: glow,
      alpha: { from: state.alpha * 0.45, to: state.alpha },
      duration: 800,
      yoyo: true,
      repeat: -1,
    })
  } else {
    glow.setAlpha(state.alpha)
  }
}

export default class HubScene extends Scene {
  constructor() {
    super('HubScene')
  }

  preload() {
    super.preload()
    this.lia = this.maki.player('lia')
    try {
      manager.map(this, 'hub_map')
    } catch (error) {
      console.warn('Hub map fallback:', error?.message ?? error)
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
    setupWorldView(this, 800, 800, this.lia.sprite)
    createSceneBackdrop(this, {
      backdrop: 0x2f5ea8,
      floor: 0x79a6df,
      grid: 0xf3fbff,
      wall: 0x182235,
      sky: 0x97c4ff,
      glow: 0xffe58d,
      sparkle: 0xf8fbff,
      horizon: 0x20365a,
    })

    this.hubWalls = createRoomWalls(this, {
      wall: 0x111a2a,
    })

    this.lia.sprite.setPosition(400, 400)
    this.physics.add.collider(this.lia.sprite, manager.getWallGroup(this, 'hub_map') ?? this.hubWalls)

    this.ui.createProgressBar(this)
    this.ui.createInventoryBar(this)
    this.ui.updateProgress(getRestoredCount(this))
    this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])

    this.add.rectangle(400, 405, 160, 110, 0x4b5d74, 1).setStrokeStyle(3, 0x101522, 1)
    this.add.rectangle(400, 460, 160, 40, 0x313c4e, 1)
    this.add.rectangle(400, 365, 300, 26, 0x88a4d8, 0.28)
    for (let i = 0; i < 10; i += 1) {
      const cloud = this.add.circle(90 + i * 68, 90 + (i % 3) * 18, 8 + (i % 2) * 4, 0xe8f2ff, 0.12)
      addAmbientMotion(this, cloud, { floatDistance: 3 + (i % 2), duration: 2500 + i * 80 })
    }

    this.buildings = {
      library: { sceneKey: 'LibraryScene', x: 175, y: 130, width: 120, height: 90, roofColor: 0x3a7ddc, bodyColor: 0x5b84a9, label: 'Library' },
      farm: { sceneKey: 'FarmScene', x: 625, y: 130, width: 120, height: 90, roofColor: 0x4dcb73, bodyColor: 0x7aa46c, label: 'Farm' },
      market: { sceneKey: 'MarketScene', x: 175, y: 350, width: 120, height: 90, roofColor: 0xffa23d, bodyColor: 0xbd7b47, label: 'Market' },
      school: { sceneKey: 'SchoolScene', x: 625, y: 350, width: 120, height: 90, roofColor: 0xb36bff, bodyColor: 0x8f6bc5, label: 'School' },
      mayor: { sceneKey: 'MayorScene', x: 400, y: 505, width: 140, height: 92, roofColor: 0xf3ce59, bodyColor: 0xa88a4c, label: 'Mayor\'s House' },
    }

    this.doormats = []
    this.doorNodes = {}

    const fixedFlags = {
      library: this.registry.get('libraryFixed'),
      farm: this.registry.get('farmFixed'),
      market: this.registry.get('marketFixed'),
      school: this.registry.get('schoolFixed'),
    }

    Object.entries(this.buildings).forEach(([key, config]) => {
      const node = drawBuilding(this, {
        ...config,
        doorColor: key === 'mayor' ? 0x6d7686 : 0x442020,
        glowColor: key === 'mayor' ? 0x8f8f8f : 0xff3c3c,
      })
      this.doorNodes[key] = node

      const fixed = fixedFlags[key]
      if (key === 'mayor') {
        const unlocked = this.registry.get('allFixed')
        node.door.setFillStyle(unlocked ? 0xf5ce5b : 0x606a7d, 1)
        node.glow.setFillStyle(unlocked ? 0xffd84d : 0x7f8796, unlocked ? 0.5 : 0.24)
        updateDoorGlow(this, node.glow, { color: unlocked ? 0xffd84d : 0x7f8796, alpha: unlocked ? 0.5 : 0.24, pulse: unlocked })
      } else if (fixed) {
        node.door.setFillStyle(0x40d36d, 1)
        updateDoorGlow(this, node.glow, { color: 0x40d36d, alpha: 0.42, pulse: false })
      } else {
        node.door.setFillStyle(0xcc3434, 1)
        updateDoorGlow(this, node.glow, { color: 0xff3737, alpha: 0.35, pulse: true })
      }

      const matWidth = key === 'mayor' ? 54 : 48
      const matHeight = 20
      const matY = key === 'mayor' ? config.y + 58 : config.y + 48
      const mat = this.add.zone(config.x, matY, matWidth, matHeight)
      this.physics.add.existing(mat, true)
      this.doormats.push({ key, target: config.sceneKey, zone: mat, width: matWidth, height: matHeight, centerX: config.x, centerY: matY })
      this.add.rectangle(config.x, matY, matWidth, matHeight, 0x1a2231, 0.6).setStrokeStyle(1, 0x607080, 1)
      this.add.text(config.x, matY - 22, key === 'mayor' && !this.registry.get('allFixed') ? 'Locked' : 'Press ENTER to enter', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: key === 'mayor' && !this.registry.get('allFixed') ? '#b9c3d2' : '#f7fbff',
        backgroundColor: '#00000099',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5)
    })

    if (this.registry.get('allFixed')) {
      const mayor = this.doorNodes.mayor
      mayor.door.setFillStyle(0xffd95f, 1)
      mayor.glow.setFillStyle(0xffd95f, 0.55)
      updateDoorGlow(this, mayor.glow, { color: 0xffd95f, alpha: 0.55, pulse: true })
      addVillageLights(this, 400, 470, 0xffd95f)
      this.add.text(400, 436, 'The Mayor wants to see you!', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffe37b',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5)
      createSparkles(this, 400, 500, 0xffd95f)
    }

    this.enterKey = this.input.keyboard.addKey('ENTER')
    this.enterKey.on('down', () => {
      if (!this.activeDoor || this.transitioning) {
        return
      }
      if (this.activeDoor === 'MayorScene' && !this.registry.get('allFixed')) {
        return
      }
      this.transitioning = true
      this.ui.fadeToScene(this, this.activeDoor, 300)
    })

    this.registry.events.on('changedata', () => {
      this.ui.updateProgress(getRestoredCount(this))
      this.ui.updateInventory(this.registry.get('inventoryItems') ?? [])
    })
  }

  update() {
    this.maki.move(this.lia)
    this.activeDoor = null
    this.ui.hideInteractHint()

    const playerX = this.lia.sprite.x
    const playerY = this.lia.sprite.y

    for (const entry of this.doormats) {
      const inside = playerX >= entry.centerX - entry.width / 2 && playerX <= entry.centerX + entry.width / 2 && playerY >= entry.centerY - entry.height / 2 && playerY <= entry.centerY + entry.height / 2
      if (inside) {
        this.activeDoor = entry.target
        if (entry.key === 'mayor' && !this.registry.get('allFixed')) {
          this.ui.showInteractHint(this, entry.centerX, entry.centerY - 34, 'Locked until all 4 are fixed')
        } else {
          this.ui.showInteractHint(this, entry.centerX, entry.centerY - 34, 'Press ENTER to enter')
        }
        break
      }
    }
  }
}
