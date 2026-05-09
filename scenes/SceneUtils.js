export function ensureRegistryDefaults(scene) {
  const defaults = {
    libraryFixed: false,
    farmFixed: false,
    marketFixed: false,
    schoolFixed: false,
    inventoryItems: [],
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (scene.registry.get(key) === undefined) {
      scene.registry.set(key, Array.isArray(value) ? [...value] : value)
    }
  }

  scene.registry.set('allFixed', getRestoredCount(scene) === 4)
}

export function getRestoredCount(scene) {
  return [
    scene.registry.get('libraryFixed'),
    scene.registry.get('farmFixed'),
    scene.registry.get('marketFixed'),
    scene.registry.get('schoolFixed'),
  ].filter(Boolean).length
}

export function markFixed(scene, key) {
  scene.registry.set(key, true)
  scene.registry.set('allFixed', getRestoredCount(scene) === 4)
}

export function addInventoryItem(scene, item) {
  const inventory = [...(scene.registry.get('inventoryItems') ?? [])]
  if (!inventory.some((entry) => entry.name === item.name)) {
    inventory.push(item)
    scene.registry.set('inventoryItems', inventory)
  }
}

export function resetProgress(scene) {
  scene.registry.set('libraryFixed', false)
  scene.registry.set('farmFixed', false)
  scene.registry.set('marketFixed', false)
  scene.registry.set('schoolFixed', false)
  scene.registry.set('allFixed', false)
  scene.registry.set('inventoryItems', [])
}

export function createSceneBackdrop(scene, palette) {
  const { width, height } = scene.scale
  scene.cameras.main.setBackgroundColor(palette.backdrop)
  scene.add.rectangle(width / 2, height / 2, width, height, palette.backdrop)
  scene.add.rectangle(width / 2, height / 4, width * 1.1, height * 0.65, palette.sky ?? 0x6ea4ff, 0.18)
  scene.add.circle(width * 0.84, height * 0.18, Math.max(width, height) * 0.18, palette.glow ?? 0xffffff, 0.08)
  scene.add.rectangle(width / 2, height / 2, width - 24, height - 24, palette.floor, 0.92)

  const skyDust = scene.add.graphics()
  skyDust.fillStyle(palette.sparkle ?? 0xffffff, 1)
  for (let i = 0; i < 18; i += 1) {
    const x = 24 + (i * 43) % width
    const y = 20 + ((i * 71) % Math.max(80, Math.floor(height / 2)))
    skyDust.fillRect(x, y, 2 + (i % 2), 2 + (i % 3 === 0 ? 1 : 0))
  }

  const horizon = scene.add.graphics()
  horizon.fillStyle(palette.horizon ?? 0x24374f, 0.28)
  horizon.fillTriangle(width * 0.02, height * 0.62, width * 0.16, height * 0.46, width * 0.30, height * 0.62)
  horizon.fillTriangle(width * 0.18, height * 0.63, width * 0.38, height * 0.40, width * 0.58, height * 0.63)
  horizon.fillTriangle(width * 0.50, height * 0.64, width * 0.70, height * 0.43, width * 0.90, height * 0.64)
  horizon.fillTriangle(width * 0.78, height * 0.62, width * 0.90, height * 0.48, width * 1.02, height * 0.62)

  const grid = scene.add.graphics()
  grid.lineStyle(1, palette.grid, 0.18)
  for (let x = 0; x < width; x += 32) {
    grid.lineBetween(x, 0, x, height)
  }
  for (let y = 0; y < height; y += 32) {
    grid.lineBetween(0, y, width, y)
  }

  const vignette = scene.add.graphics()
  vignette.fillStyle(0x000000, 0.16)
  vignette.fillRect(0, 0, width, 16)
  vignette.fillRect(0, height - 16, width, 16)
  vignette.fillRect(0, 0, 16, height)
  vignette.fillRect(width - 16, 0, 16, height)
}

export function setupWorldView(scene, width, height, followSprite = null) {
  scene.physics.world.setBounds(0, 0, width, height)
  scene.cameras.main.setBounds(0, 0, width, height)
  if (followSprite) {
    scene.cameras.main.startFollow(followSprite, true, 0.08, 0.08)
  }
}

export function enableWASDMovement(scene, player) {
  const cursors = scene.input.keyboard.createCursorKeys()
  const wasd = scene.input.keyboard.addKeys({
    up: 'W',
    down: 'S',
    left: 'A',
    right: 'D',
  })

  const combine = (primary, secondary) => ({
    get isDown() {
      return primary.isDown || secondary.isDown
    },
  })

  player.keys = {
    left: combine(cursors.left, wasd.left),
    right: combine(cursors.right, wasd.right),
    up: combine(cursors.up, wasd.up),
    down: combine(cursors.down, wasd.down),
  }
}

export function addAmbientMotion(scene, targets, options = {}) {
  const floatDistance = options.floatDistance ?? 4
  const duration = options.duration ?? 2200
  scene.tweens.add({
    targets,
    y: `-=${floatDistance}`,
    duration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })
}

export function addVillageLights(scene, x, y, color = 0xffd95f) {
  const light = scene.add.circle(x, y, 8, color, 0.5)
  scene.tweens.add({
    targets: light,
    alpha: { from: 0.25, to: 0.7 },
    scale: { from: 0.85, to: 1.15 },
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })
  return light
}

export function createRoomWalls(scene, palette) {
  const walls = scene.physics.add.staticGroup()
  const w = scene.scale.width
  const h = scene.scale.height
  const thickness = 24
  const wallRects = [
    [w / 2, thickness / 2, w, thickness],
    [w / 2, h - thickness / 2, w, thickness],
    [thickness / 2, h / 2, thickness, h],
    [w - thickness / 2, h / 2, thickness, h],
  ]

  wallRects.forEach(([x, y, width, height]) => {
    const wall = scene.add.rectangle(x, y, width, height, palette.wall, 0.01)
    scene.physics.add.existing(wall, true)
    walls.add(wall)
  })

  return walls
}

export function createPixelNpc(scene, x, y, color, name) {
  const container = scene.add.container(x, y)
  const body = scene.add.rectangle(0, 4, 18, 32, color)
  body.setStrokeStyle(2, 0x0b0f16, 1)

  const head = scene.add.rectangle(0, -12, 16, 12, 0xf3d7b6)
  head.setStrokeStyle(1, 0x0b0f16, 1)

  const face = scene.add.graphics()
  face.fillStyle(0x0b0f16, 1)
  face.fillRect(-4, -14, 2, 2)
  face.fillRect(2, -14, 2, 2)
  face.lineStyle(1, 0x0b0f16, 1)
  face.beginPath()
  face.moveTo(-4, -8)
  face.lineTo(0, -6)
  face.lineTo(4, -8)
  face.strokePath()

  const label = scene.add.text(0, -34, name, {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#ffffff',
    backgroundColor: '#00000088',
    padding: { x: 4, y: 2 },
  }).setOrigin(0.5)

  container.add([body, head, face, label])
  container.setSize(18, 40)
  return container
}

export function createSparkles(scene, x, y, tint) {
  const particles = scene.add.particles(0, 0, 'sparkle', {
    x,
    y,
    speed: { min: 10, max: 36 },
    scale: { start: 0.8, end: 0 },
    lifespan: 700,
    quantity: 2,
    tint,
    blendMode: 'ADD',
    frequency: 220,
  })
  return particles
}

export function createTinyTexture(scene, key, drawFn) {
  if (scene.textures.exists(key)) {
    return
  }

  const g = scene.add.graphics()
  drawFn(g)
  g.generateTexture(key, 64, 64)
  g.destroy()
}

export function createInventoryIcon(scene, item, x, y) {
  const container = scene.add.container(x, y)
  const bg = scene.add.rectangle(0, 0, 28, 28, 0x101823, 0.88)
  bg.setStrokeStyle(2, item.color, 1)
  const emoji = scene.add.text(0, -1, item.emoji, {
    fontFamily: 'sans-serif',
    fontSize: '16px',
    color: '#ffffff',
  }).setOrigin(0.5)
  container.add([bg, emoji])
  return container
}
