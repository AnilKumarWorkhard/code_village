export default class UIManager {
  constructor(scene) {
    this.scene = scene
    this.dialogueActive = false
    this.dialogueTyping = false
    this.dialogueLines = []
    this.dialogueIndex = 0
    this.currentTypedText = ''
    this.onDialogueComplete = null
    this.interactHint = null
    this.progressBar = null
    this.inventoryBar = null
    this.pickupToast = null
    this.puzzlePanel = null
    this.puzzleMessage = null
    this.puzzleState = null
    this.overlay = null
    this.ensureTextures()
  }

  ensureTextures() {
    const scene = this.scene
    if (!scene.textures.exists('sparkle')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0xffffff, 1)
      graphics.fillRect(7, 0, 2, 16)
      graphics.fillRect(0, 7, 16, 2)
      graphics.fillStyle(0xdde8ff, 1)
      graphics.fillRect(5, 5, 6, 6)
      graphics.generateTexture('sparkle', 16, 16)
      graphics.destroy()
    }
  }

  createDialogueBox(scene = this.scene) {
    if (this.dialogueBox) {
      return this.dialogueBox
    }

    const width = scene.scale.width
    const height = scene.scale.height
    const boxHeight = 150
    const container = scene.add.container(0, height - boxHeight)
    container.setDepth(2000)
    container.setScrollFactor(0)

    const bg = scene.add.rectangle(width / 2, boxHeight / 2, width, boxHeight, 0x05070d, 0.86)
    bg.setStrokeStyle(2, 0x3d536f, 1)

    const nameText = scene.add.text(28, 14, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#7dd3ff',
      fontStyle: 'bold',
    })

    const bodyText = scene.add.text(28, 44, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f5f7ff',
      wordWrap: { width: width - 56 },
      lineSpacing: 6,
    })

    const continueText = scene.add.text(width - 32, boxHeight - 24, 'Press SPACE to continue', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#b9c8e6',
    }).setOrigin(1, 1)

    container.add([bg, nameText, bodyText, continueText])
    container.setVisible(false)

    this.dialogueBox = container
    this.dialogueBg = bg
    this.dialogueNameText = nameText
    this.dialogueBodyText = bodyText
    this.dialogueContinueText = continueText

    scene.tweens.add({
      targets: continueText,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    scene.input.keyboard.on('keydown-SPACE', () => {
      if (!this.dialogueActive) {
        return
      }

      if (this.dialogueTyping) {
        this.finishTypingInstantly()
        return
      }

      this.advanceDialogue()
    })

    return container
  }

  showDialogue(npcName, nameColor, lines, onComplete) {
    this.createDialogueBox()
    this.dialogueActive = true
    this.dialogueTyping = false
    this.dialogueLines = [...lines]
    this.dialogueIndex = 0
    this.onDialogueComplete = onComplete
    this.dialogueNameText.setColor(nameColor)
    this.dialogueNameText.setText(npcName)
    this.dialogueBox.setVisible(true)
    this.typeLine(this.dialogueLines[0] ?? '', true)
  }

  typeLine(line, animate = true) {
    this.currentTypedText = ''
    this.dialogueTyping = animate
    this.dialogueBodyText.setText('')

    if (!animate) {
      this.dialogueBodyText.setText(line)
      this.dialogueTyping = false
      return
    }

    const chars = [...line]
    let index = 0
    this.typingEvent?.remove(false)
    this.typingEvent = this.scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (index >= chars.length) {
          this.typingEvent.remove(false)
          this.dialogueTyping = false
          return
        }
        this.currentTypedText += chars[index]
        index += 1
        this.dialogueBodyText.setText(this.currentTypedText)
      },
    })
  }

  finishTypingInstantly() {
    if (!this.dialogueTyping) {
      return
    }
    this.typingEvent?.remove(false)
    this.dialogueTyping = false
    this.dialogueBodyText.setText(this.dialogueLines[this.dialogueIndex] ?? '')
  }

  advanceDialogue() {
    this.dialogueIndex += 1
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.hideDialogue()
      const callback = this.onDialogueComplete
      this.onDialogueComplete = null
      if (callback) {
        callback()
      }
      return
    }

    this.typeLine(this.dialogueLines[this.dialogueIndex], true)
  }

  hideDialogue() {
    this.typingEvent?.remove(false)
    this.dialogueActive = false
    this.dialogueTyping = false
    this.dialogueBox?.setVisible(false)
    this.dialogueBodyText?.setText('')
  }

  showInteractHint(scene = this.scene, x, y, label = 'Press SPACE') {
    this.hideInteractHint()
    this.interactHint = scene.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1)
    this.interactHint.setDepth(3000)
    scene.tweens.add({
      targets: this.interactHint,
      y: y - 6,
      alpha: { from: 0.7, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
  }

  hideInteractHint() {
    if (this.interactHint) {
      this.interactHint.destroy()
      this.interactHint = null
    }
  }

  createProgressBar(scene = this.scene) {
    if (this.progressBar) {
      return this.progressBar
    }

    const width = scene.scale.width
    const container = scene.add.container(0, 0)
    container.setScrollFactor(0)
    container.setDepth(4000)

    const bg = scene.add.rectangle(width / 2, 20, width, 40, 0x08101a, 0.84)
    bg.setStrokeStyle(1, 0x2e4461, 1)

    const title = scene.add.text(20, 8, 'Code Village', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f4f7ff',
      fontStyle: 'bold',
    })

    const progressText = scene.add.text(width - 20, 8, 'Restored: 0 / 4', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f4f7ff',
    }).setOrigin(1, 0)

    container.add([bg, title, progressText])
    this.progressBar = container
    this.progressText = progressText
    return container
  }

  updateProgress(count) {
    if (this.progressText) {
      this.progressText.setText(`Restored: ${count} / 4`)
    }
  }

  createInventoryBar(scene = this.scene) {
    if (this.inventoryBar) {
      return this.inventoryBar
    }

    const container = scene.add.container(16, scene.scale.height - 42)
    container.setScrollFactor(0)
    container.setDepth(3800)

    const bg = scene.add.rectangle(0, 0, 250, 34, 0x08101a, 0.84).setOrigin(0, 0)
    bg.setStrokeStyle(1, 0x2e4461, 1)
    const label = scene.add.text(10, 8, 'Inventory', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#c9d7ef',
    })

    container.add([bg, label])
    this.inventoryBar = container
    this.inventoryIcons = []
    return container
  }

  updateInventory(items = []) {
    if (!this.inventoryBar) {
      return
    }

    this.inventoryIcons.forEach((icon) => icon.destroy())
    this.inventoryIcons = []
    let offsetX = 88
    items.forEach((item) => {
      const icon = this.createInventoryIcon(this.scene, item, offsetX, 17)
      this.inventoryBar.add(icon)
      this.inventoryIcons.push(icon)
      offsetX += 40
    })
  }

  createInventoryIcon(scene, item, x, y) {
    const container = scene.add.container(x, y)
    const bg = scene.add.rectangle(0, 0, 30, 30, 0x142030, 0.95)
    bg.setStrokeStyle(1, item.color, 1)
    const emoji = scene.add.text(0, 0, item.emoji, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5)
    const name = scene.add.text(0, 22, item.name, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#d7e4ff',
    }).setOrigin(0.5)
    container.add([bg, emoji, name])
    return container
  }

  showItemPickup(itemName, itemEmoji) {
    this.pickupToast?.destroy()
    const scene = this.scene
    const width = scene.scale.width
    const container = scene.add.container(width + 180, 100)
    container.setScrollFactor(0)
    container.setDepth(5000)

    const bg = scene.add.rectangle(0, 0, 300, 56, 0x0d1320, 0.96)
    bg.setStrokeStyle(2, 0x8ed8ff, 1)
    const text = scene.add.text(0, 0, `Received: ${itemEmoji} ${itemName}`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f7fbff',
    }).setOrigin(0.5)
    container.add([bg, text])
    this.pickupToast = container

    scene.tweens.add({
      targets: container,
      x: width - 170,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        scene.time.delayedCall(2500, () => {
          scene.tweens.add({
            targets: container,
            x: width + 180,
            duration: 300,
            ease: 'Cubic.easeIn',
            onComplete: () => container.destroy(),
          })
        })
      },
    })
  }

  handleWrong(message = 'Try again!') {
    this.playWrongSound()
    if (this.puzzlePanel) {
      this.puzzlePanel.setTint(0xff8080)
      this.scene.cameras.main.shake(170, 0.006)
      this.scene.time.delayedCall(80, () => this.puzzlePanel.clearTint())
    }
    this.setPuzzleMessage(message, '#ffb4b4')
  }

  handleCorrect(message = 'Correct!') {
    this.playCorrectSound()
    if (this.puzzlePanel) {
      this.puzzlePanel.setTint(0xa8ffb0)
      this.scene.cameras.main.flash(150, 120, 255, 140)
      this.scene.time.delayedCall(120, () => this.puzzlePanel.clearTint())
    }
    this.setPuzzleMessage(message, '#d7ffd9')
  }

  setPuzzleMessage(message, color = '#ffffff') {
    if (this.puzzleMessage) {
      this.puzzleMessage.setText(message)
      this.puzzleMessage.setColor(color)
      this.puzzleMessage.setAlpha(1)
      this.scene.tweens.add({
        targets: this.puzzleMessage,
        alpha: 0,
        delay: 1600,
        duration: 450,
      })
    }
  }

  showPuzzle(config) {
    this.hidePuzzle()
    const scene = this.scene
    const width = scene.scale.width
    const height = scene.scale.height
    const isSequence = config.type === 'sequence'

    const container = scene.add.container(width / 2, height / 2)
    container.setDepth(4500)
    container.setScrollFactor(0)

    const panel = scene.add.rectangle(0, 0, 640, isSequence ? 468 : 444, isSequence ? 0x121a2f : 0x0b111d, 0.97)
    panel.setStrokeStyle(4, isSequence ? 0xffcf6a : 0x94b4ff, 1)
    const headerBar = scene.add.rectangle(0, -170, 592, 72, isSequence ? 0x18233b : 0x111a2b, 1)
    headerBar.setStrokeStyle(1, isSequence ? 0xffcf6a : 0x94b4ff, 0.42)

    const title = scene.add.text(-270, -194, config.title, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: isSequence ? '#ffe8a6' : '#f2f7ff',
      fontStyle: 'bold',
    })
    const instructions = scene.add.text(-270, -160, config.instructions, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: isSequence ? '#e8f1ff' : '#cad6f3',
      wordWrap: { width: 580 },
    })
    const divider = scene.add.rectangle(0, -130, 592, 2, isSequence ? 0xffcf6a : 0x94b4ff, 0.3)
    const message = scene.add.text(0, 188, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#d7ffd9',
    }).setOrigin(0.5)

    container.add([panel, headerBar, title, instructions, divider, message])
    this.puzzlePanel = panel
    this.puzzleMessage = message
    this.puzzlePanelContainer = container
    this.puzzleState = {
      config,
      matched: 0,
      selectedItem: null,
      expectedIndex: 0,
      buttons: [],
      correctPairs: 0,
      matchedItems: new Set(),
      matchedNames: new Set(),
    }

    if (config.type === 'sequence') {
      this.buildSequencePuzzle(config, container)
    } else if (config.type === 'matching') {
      this.buildMatchingPuzzle(config, container)
    } else {
      this.buildSingleChoicePuzzle(config, container)
    }

    this.puzzlePanelContainer.setVisible(true)
    this.puzzleActive = true
    return container
  }

  hidePuzzle() {
    this.puzzleActive = false
    this.puzzleState = null
    this.puzzlePanelContainer?.destroy()
    this.puzzlePanelContainer = null
    this.puzzlePanel = null
    this.puzzleMessage = null
  }

  buildSingleChoicePuzzle(config, container) {
    const scene = this.scene
    const buttons = []
    const startY = -72
    config.options.forEach((option, index) => {
      const button = this.createButton(scene, option.label, -254, startY + index * 74, 508, 54)
      button.on('pointerdown', () => {
        if (option.correct) {
          this.handleCorrect(config.successMessage ?? 'Correct!')
          scene.time.delayedCall(200, () => {
            this.hidePuzzle()
            config.onCorrect?.(option)
          })
        } else {
          this.handleWrong(option.wrongMessage ?? 'Try again!')
        }
      })
      container.add(button)
      buttons.push(button)
    })
    this.puzzleState.buttons = buttons
  }

  buildSequencePuzzle(config, container) {
    const scene = this.scene
    const buttons = []
    const order = config.sequence ?? config.options.map((option) => option.label)
    const labels = config.options.map((option) => option.label)
    const boardTitle = scene.add.text(-286, -118, 'Story Order Board', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#ffe38a',
      fontStyle: 'bold',
    })
    const orderGuide = scene.add.text(-286, -92, 'Tap the cards in order: first, second, third.', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d8e8ff',
      wordWrap: { width: 560 },
    })
    const progressText = scene.add.text(208, -118, 'Step 1 / 3', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#122035',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0)

    container.add([boardTitle, orderGuide, progressText])
    this.puzzleState.progressText = progressText

    labels.forEach((label, index) => {
      const slotY = -28 + index * 92
      const slot = scene.add.rectangle(0, slotY, 556, 74, 0x0f1626, 0.96)
      slot.setStrokeStyle(2, 0x405d80, 1)

      const numberBadge = scene.add.text(-250, slotY, String(index + 1), {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#182133',
        backgroundColor: '#ffe38a',
        padding: { x: 10, y: 4 },
      }).setOrigin(0.5)

      const button = scene.add.container(20, slotY)
      const card = scene.add.rectangle(0, 0, 432, 46, 0x24344a, 1)
      card.setStrokeStyle(2, 0x93c2ff, 1)
      const labelText = scene.add.text(0, 0, label, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f7fbff',
        align: 'center',
        wordWrap: { width: 388 },
      }).setOrigin(0.5)

      button.add([card, labelText])
      button.setSize(432, 46)
      const sequenceHitArea = new Phaser.Geom.Rectangle(-216, -23, 432, 46)
      button.setInteractive(sequenceHitArea, Phaser.Geom.Rectangle.Contains)
      button.input.cursor = 'pointer'
      button.setData('card', card)
      button.setData('done', false)

      button.on('pointerover', () => {
        if (!button.getData('done')) {
          card.setFillStyle(0x39516e, 1)
        }
      })

      button.on('pointerout', () => {
        if (!button.getData('done')) {
          card.setFillStyle(0x24344a, 1)
        }
      })

      button.on('pointerdown', () => {
        const expected = order[this.puzzleState.expectedIndex]
        if (label === expected) {
          button.setData('done', true)
          card.setFillStyle(0x2e7d4f, 1)
          numberBadge.setColor('#dfffe9')
          numberBadge.setBackgroundColor('#2e7d4f')
          labelText.setColor('#ffffff')
          this.puzzleState.expectedIndex += 1
          this.puzzleState.progressText?.setText(`Step ${Math.min(this.puzzleState.expectedIndex + 1, 3)} / 3`)

          if (this.puzzleState.expectedIndex >= order.length) {
            this.handleCorrect(config.successMessage ?? 'Perfect!')
            this.setPuzzleMessage('Sequence solved!', '#d7ffd9')
            buttons.forEach((entry) => entry.disableInteractive())
            this.hidePuzzle()
            scene.time.delayedCall(80, () => {
              config.onCorrect?.()
            })
          } else {
            this.setPuzzleMessage(`Nice. Next: ${order[this.puzzleState.expectedIndex]}`, '#e6ffcf')
          }
        } else {
          buttons.forEach((entry) => {
            entry.getData('card')?.setFillStyle(0x24344a, 1)
            entry.setData('done', false)
          })
          this.puzzleState.expectedIndex = 0
          this.puzzleState.progressText?.setText('Step 1 / 3')
          this.handleWrong(config.wrongMessage ?? 'Wrong order. Try again!')
        }
      })

      container.add([slot, numberBadge, button])
      buttons.push(button)
    })
    this.puzzleState.buttons = buttons
  }

  buildMatchingPuzzle(config, container) {
    const scene = this.scene
    const itemButtons = []
    const nameButtons = []
    const items = config.items
    const names = config.names

    scene.add.text(-272, -108, 'Items', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#9fd0ff',
    }).setPosition(-272, -132)
    scene.add.text(150, -108, 'Names', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#ffd59f',
    }).setPosition(150, -132)

    items.forEach((item, index) => {
      const button = this.createButton(scene, `${item.emoji} ${item.label}`, -282, -92 + index * 72, 252, 54)
      button.setOrigin(0, 0.5)
      button.on('pointerdown', () => {
        if (this.puzzleState.matchedItems.has(item.label)) {
          return
        }
        this.puzzleState.selectedItem = item
        itemButtons.forEach((entry) => entry.setAlpha(0.6))
        button.setAlpha(1)
        this.setPuzzleMessage(`Select a name for ${item.label}`, '#d7e4ff')
      })
      container.add(button)
      itemButtons.push(button)
    })

    names.forEach((name, index) => {
      const button = this.createButton(scene, name, 114, -92 + index * 72, 248, 54)
      button.setOrigin(0, 0.5)
      button.on('pointerdown', () => {
        const selected = this.puzzleState.selectedItem
        if (!selected) {
          this.setPuzzleMessage('Pick an item first.', '#ffd9a8')
          return
        }

        if (selected.match === name) {
          this.setButtonState(button, 0x2e7d4f)
          const matchedItemButton = itemButtons.find((entry) => entry.getData('itemLabel') === selected.label)
          if (matchedItemButton) {
            this.setButtonState(matchedItemButton, 0x2e7d4f)
          }
          this.puzzleState.matchedItems.add(selected.label)
          this.puzzleState.matchedNames.add(name)
          this.puzzleState.selectedItem = null
          this.puzzleState.correctPairs += 1
          this.handleCorrect(`${selected.label} matched.`)
          if (this.puzzleState.correctPairs >= items.length) {
            scene.time.delayedCall(250, () => {
              this.hidePuzzle()
              config.onCorrect?.()
            })
          }
        } else {
          this.handleWrong(config.wrongMessage ?? 'That does not match. Try again!')
          this.puzzleState.selectedItem = null
          itemButtons.forEach((entry) => entry.setAlpha(1))
        }
      })
      container.add(button)
      nameButtons.push(button)
    })

    itemButtons.forEach((button, index) => {
      button.setData('itemLabel', items[index].label)
    })

    this.puzzleState.buttons = [...itemButtons, ...nameButtons]
  }

  createButton(scene, label, x, y, width, height) {
    const container = scene.add.container(x, y)
    const rect = scene.add.rectangle(0, 0, width, height, 0x233244, 1)
    rect.setStrokeStyle(2, 0x6f89a8, 1)
    const text = scene.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#f3f8ff',
      align: 'center',
      wordWrap: { width: width - 24 },
    }).setOrigin(0.5)
    container.add([rect, text])
    container.setSize(width, height)
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height)
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
    container.input.cursor = 'pointer'
    container.on('pointerover', () => rect.setFillStyle(0x314662, 1))
    container.on('pointerout', () => rect.setFillStyle(0x233244, 1))
    container.on('pointerdown', () => this.playPickupSound())
    container.setData('rect', rect)
    container.setData('text', text)
    return container
  }

  setButtonState(button, fillColor) {
    const rect = button.getData('rect')
    if (rect) {
      rect.setFillStyle(fillColor, 1)
    }
  }

  fadeToScene(currentScene, targetSceneKey, duration = 300) {
    this.playTransitionSound()
    const camera = currentScene.cameras.main
    if (!this.overlay) {
      this.overlay = currentScene.add.rectangle(camera.centerX, camera.centerY, currentScene.scale.width, currentScene.scale.height, 0x000000, 0)
      this.overlay.setScrollFactor(0)
      this.overlay.setDepth(10000)
    }

    camera.fadeOut(duration, 0, 0, 0)
    currentScene.tweens.add({
      targets: this.overlay,
      alpha: 1,
      duration,
      onComplete: () => {
        currentScene.time.delayedCall(duration, () => currentScene.scene.start(targetSceneKey))
      },
    })
  }

  playCorrectSound() {
    this.playToneSequence([
      { frequency: 220, duration: 0.12 },
      { frequency: 330, duration: 0.12 },
      { frequency: 440, duration: 0.14 },
    ])
  }

  playWrongSound() {
    this.playToneSequence([
      { frequency: 440, duration: 0.1 },
      { frequency: 330, duration: 0.08 },
      { frequency: 220, duration: 0.08 },
    ])
  }

  playPickupSound() {
    this.playToneSequence([
      { frequency: 330, duration: 0.08 },
      { frequency: 440, duration: 0.08 },
      { frequency: 554, duration: 0.1 },
    ])
  }

  playTransitionSound() {
    const context = this.scene.sound?.context
    if (!context) {
      return
    }
    const bufferSize = context.sampleRate * 0.4
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1800
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.38)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    source.start()
    source.stop(context.currentTime + 0.4)
  }

  playToneSequence(sequence) {
    const context = this.scene.sound?.context
    if (!context) {
      return
    }
    let start = context.currentTime
    sequence.forEach((step) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'square'
      oscillator.frequency.value = step.frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + step.duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + step.duration)
      start += step.duration * 0.95
    })
  }
}
