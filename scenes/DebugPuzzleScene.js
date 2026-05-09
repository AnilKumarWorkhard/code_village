// Debug scene for testing puzzle button clicks
import { Scene } from '@tialops/maki'
import UIManager from './UIManager.js'

export default class DebugPuzzleScene extends Scene {
  constructor() {
    super('DebugPuzzleScene')
  }

  preload() {
    super.preload()
  }

  create() {
    super.create()
    this.ui = new UIManager(this)
    
    // Create a simple background
    this.add.rectangle(400, 300, 800, 600, 0x1a2a4a, 1)
    
    // Add title
    this.add.text(400, 50, 'DEBUG: Button Click Test', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffff00',
    }).setOrigin(0.5)
    
    this.add.text(400, 100, 'Click any button below to test the hitArea fix', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aabbcc',
    }).setOrigin(0.5)
    
    // Create test buttons manually
    console.log('[DEBUG] Creating test buttons with explicit hitAreas...');
    
    this.testButtons = [];
    const buttonLabels = ['Button 1', 'Button 2', 'Button 3'];
    
    buttonLabels.forEach((label, index) => {
      const y = 200 + index * 80;
      const button = this.ui.createButton(this, label, 400, y, 300, 50);
      
      // Add click handler to see if events fire
      button.on('pointerdown', () => {
        console.log(`[DEBUG] Button "${label}" clicked! Event fired successfully.`);
        this.ui.playCorrectSound();
        button.getData('text')?.setText(`${label} - CLICKED!`);
        button.getData('rect')?.setFillStyle(0x00ff00, 1);
      });
      
      this.testButtons.push(button);
      this.add.existing(button);
    });
    
    this.add.text(400, 450, 'Check browser console for click events', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#88dd88',
    }).setOrigin(0.5);
    
    this.add.text(400, 500, 'Press Y to return to Hub', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#dd88dd',
    }).setOrigin(0.5);
    
    this.input.keyboard.addKey('Y').on('down', () => {
      console.log('[DEBUG] Returning to Hub');
      this.scene.start('HubScene');
    });
  }

  update() {
    // Empty update
  }
}
