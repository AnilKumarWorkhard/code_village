// Direct test of puzzle button click behavior
// This file tests if the hitArea and pointerdown events are working properly

import Phaser from 'phaser';

// Create a minimal test scene
class TestPuzzleScene extends Phaser.Scene {
  constructor() {
    super('TestPuzzleScene');
    this.clicked = false;
    this.clickCount = 0;
  }

  create() {
    const width = 400;
    const height = 60;
    
    // Create a test button exactly like in UIManager
    const container = this.add.container(200, 200);
    const rect = this.add.rectangle(0, 0, width, height, 0x233244, 1);
    rect.setStrokeStyle(2, 0x6f89a8, 1);
    const text = this.add.text(0, 0, 'CLICK ME TO TEST', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f3f8ff',
      align: 'center'
    }).setOrigin(0.5);
    
    container.add([rect, text]);
    container.setSize(width, height);
    
    // Set interactive with explicit hitArea (THE FIX)
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    container.input.cursor = 'pointer';
    
    // Add event listeners
    container.on('pointerover', () => {
      rect.setFillStyle(0x314662, 1);
      console.log('[TEST] pointerover fired');
    });
    
    container.on('pointerout', () => {
      rect.setFillStyle(0x233244, 1);
      console.log('[TEST] pointerout fired');
    });
    
    container.on('pointerdown', () => {
      this.clicked = true;
      this.clickCount++;
      rect.setFillStyle(0x2e7d4f, 1);
      text.setColor('#ffffff');
      text.setText(`CLICKED! (${this.clickCount}x)`);
      console.log('[TEST] pointerdown fired - click count:', this.clickCount);
    });
    
    // Add debug text
    this.add.text(200, 50, 'Test Button - Click me to verify hitArea works', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(200, 350, 'Check console for event logs', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aabbcc'
    }).setOrigin(0.5);
  }
}

// Create a small test game
const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 400,
  scene: [TestPuzzleScene],
  canvas: document.getElementById('test-canvas'),
  physics: {
    default: 'arcade'
  }
};

console.log('[TEST] Creating test game...');
const game = new Phaser.Game(config);

// Export for testing
export { game, TestPuzzleScene };
