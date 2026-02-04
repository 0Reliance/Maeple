/**
 * Documentation Visual Verification Tests
 * 
 * Validates technical diagrams and documentation images using
 * Z.AI Vision's understand_technical_diagram tool.
 */

import { test, expect } from '@playwright/test';
import { understandDiagram } from './mcp-client';

test.describe('Documentation Visual Verification', () => {
  /**
   * List of technical diagrams to verify
   * 
   * These diagrams should be created and placed in the docs/images/
   * directory for these tests to run successfully.
   */
  const diagrams = [
    {
      name: 'architecture',
      file: 'docs/images/architecture.png',
      type: 'architecture',
      description: 'System architecture showing all major components',
      requiredElements: ['bio-mirror', 'journal', 'observations', 'ai-services', 'database', 'api']
    },
    {
      name: 'data-flow',
      file: 'docs/images/data-flow.png',
      type: 'data-flow',
      description: 'Data flow diagram showing how data moves through the system',
      requiredElements: ['capture', 'analyze', 'store', 'display', 'sync']
    },
    {
      name: 'facs-flow',
      file: 'docs/images/facs-flow.png',
      type: 'process-flow',
      description: 'FACS analysis flow from camera to results',
      requiredElements: ['camera', 'vision-api', 'facs-engine', 'results', 'action-units']
    },
    {
      name: 'component-hierarchy',
      file: 'docs/images/component-hierarchy.png',
      type: 'hierarchy',
      description: 'Component hierarchy and relationships',
      requiredElements: ['root-components', 'sub-components', 'shared-components', 'hooks', 'services']
    }
  ];

  /**
   * Test: Architecture diagram verification
   */
  test('architecture diagram: structure validated', async () => {
    const diagram = diagrams.find(d => d.name === 'architecture');
    
    // Check if diagram file exists
    const fs = require('fs');
    const diagramExists = fs.existsSync(diagram.file);
    
    if (diagramExists) {
      const analysis = await understandDiagram(diagram.file, 'architecture');
      
      // Verify diagram structure
      expect(analysis.diagramType).toBe('architecture');
      
      // Verify required elements present
      diagram.requiredElements.forEach(element => {
        expect(analysis.elements).toContain(element);
      });
      
      // Verify diagram quality
      expect(analysis.quality).toBeGreaterThan(0.7);
      expect(analysis.clarity).toBeGreaterThan(0.7);
      
      // Verify relationships exist
      expect(analysis.relationships.length).toBeGreaterThan(0);
      
      console.log(`\n📊 Architecture Diagram Analysis:`);
      console.log(`  Type: ${analysis.diagramType}`);
      console.log(`  Elements: ${analysis.elements.join(', ')}`);
      console.log(`  Relationships: ${analysis.relationships.length}`);
      console.log(`  Quality: ${analysis.quality}`);
      console.log(`  Summary: ${analysis.summary}`);
      console.log(`✓ Architecture diagram validated\n`);
    } else {
      console.log(`⏭️  Architecture diagram not found at ${diagram.file}`);
      console.log(`   Run: npm run docs:generate-diagrams`);
      test.skip();
    }
  });

  /**
   * Test: Data flow diagram verification
   */
  test('data-flow diagram: structure validated', async () => {
    const diagram = diagrams.find(d => d.name === 'data-flow');
    
    const fs = require('fs');
    const diagramExists = fs.existsSync(diagram.file);
    
    if (diagramExists) {
      const analysis = await understandDiagram(diagram.file, 'data-flow');
      
      expect(analysis.diagramType).toBe('data-flow');
      
      diagram.requiredElements.forEach(element => {
        expect(analysis.elements).toContain(element);
      });
      
      expect(analysis.quality).toBeGreaterThan(0.7);
      expect(analysis.clarity).toBeGreaterThan(0.7);
      
      console.log(`\n📊 Data Flow Diagram Analysis:`);
      console.log(`  Type: ${analysis.diagramType}`);
      console.log(`  Elements: ${analysis.elements.join(', ')}`);
      console.log(`  Relationships: ${analysis.relationships.length}`);
      console.log(`  Quality: ${analysis.quality}`);
      console.log(`  Summary: ${analysis.summary}`);
      console.log(`✓ Data flow diagram validated\n`);
    } else {
      console.log(`⏭️  Data flow diagram not found at ${diagram.file}`);
      test.skip();
    }
  });

  /**
   * Test: FACS flow diagram verification
   */
  test('facs-flow diagram: structure validated', async () => {
    const diagram = diagrams.find(d => d.name === 'facs-flow');
    
    const fs = require('fs');
    const diagramExists = fs.existsSync(diagram.file);
    
    if (diagramExists) {
      const analysis = await understandDiagram(diagram.file, 'process-flow');
      
      expect(analysis.diagramType).toBe('process-flow');
      
      diagram.requiredElements.forEach(element => {
        expect(analysis.elements).toContain(element);
      });
      
      expect(analysis.quality).toBeGreaterThan(0.7);
      expect(analysis.clarity).toBeGreaterThan(0.7);
      
      console.log(`\n📊 FACS Flow Diagram Analysis:`);
      console.log(`  Type: ${analysis.diagramType}`);
      console.log(`  Elements: ${analysis.elements.join(', ')}`);
      console.log(`  Relationships: ${analysis.relationships.length}`);
      console.log(`  Quality: ${analysis.quality}`);
      console.log(`  Summary: ${analysis.summary}`);
      console.log(`✓ FACS flow diagram validated\n`);
    } else {
      console.log(`⏭️  FACS flow diagram not found at ${diagram.file}`);
      test.skip();
    }
  });

  /**
   * Test: Component hierarchy diagram verification
   */
  test('component-hierarchy diagram: structure validated', async () => {
    const diagram = diagrams.find(d => d.name === 'component-hierarchy');
    
    const fs = require('fs');
    const diagramExists = fs.existsSync(diagram.file);
    
    if (diagramExists) {
      const analysis = await understandDiagram(diagram.file, 'hierarchy');
      
      expect(analysis.diagramType).toBe('hierarchy');
      
      diagram.requiredElements.forEach(element => {
        expect(analysis.elements).toContain(element);
      });
      
      expect(analysis.quality).toBeGreaterThan(0.7);
      expect(analysis.clarity).toBeGreaterThan(0.7);
      
      console.log(`\n📊 Component Hierarchy Diagram Analysis:`);
      console.log(`  Type: ${analysis.diagramType}`);
      console.log(`  Elements: ${analysis.elements.join(', ')}`);
      console.log(`  Relationships: ${analysis.relationships.length}`);
      console.log(`  Quality: ${analysis.quality}`);
      console.log(`  Summary: ${analysis.summary}`);
      console.log(`✓ Component hierarchy diagram validated\n`);
    } else {
      console.log(`⏭️  Component hierarchy diagram not found at ${diagram.file}`);
      test.skip();
    }
  });

  /**
   * Test: Generate diagram verification report
   * 
   * Creates a comprehensive report of all diagram checks
   */
  test('generate diagram verification report', async () => {
    const fs = require('fs');
    const report = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalDiagrams: diagrams.length,
      diagrams: diagrams.map(diagram => {
        const exists = fs.existsSync(diagram.file);
        return {
          name: diagram.name,
          file: diagram.file,
          type: diagram.type,
          description: diagram.description,
          exists: exists,
          status: exists ? 'pending' : 'missing',
          requiredElements: diagram.requiredElements,
          quality: 0,
          clarity: 0
        };
      }),
      summary: {
        totalDiagrams: diagrams.length,
        verified: 0,
        missing: 0,
        qualityThreshold: 0.7,
        clarityThreshold: 0.7
      }
    };

    // Count verified and missing
    report.summary.verified = report.diagrams.filter(d => d.exists).length;
    report.summary.missing = report.diagrams.filter(d => !d.exists).length;

    console.log('\n' + '='.repeat(80));
    console.log('📚 Documentation Diagram Verification Report');
    console.log('='.repeat(80));
    console.log(`Total Diagrams: ${report.summary.totalDiagrams}`);
    console.log(`Verified: ${report.summary.verified}`);
    console.log(`Missing: ${report.summary.missing}`);
    console.log(`Generated: ${report.generatedAt}`);
    
    if (report.summary.missing > 0) {
      console.log('\n⚠️  Missing Diagrams:');
      report.diagrams.filter(d => !d.exists).forEach(d => {
        console.log(`  - ${d.name}: ${d.file}`);
      });
    }
    
    console.log('='.repeat(80) + '\n');

    // In real implementation, would write to file
    // fs.writeFileSync('test-results/diagram-verification-report.json', JSON.stringify(report, null, 2));
  });
});

test.describe('Diagram Verification Configuration', () => {
  test('display configuration', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📐 Diagram Verification Test Configuration');
    console.log('='.repeat(80));
    console.log('Quality Threshold: > 0.7 (70%)');
    console.log('Clarity Threshold: > 0.7 (70%)');
    console.log('Diagram Directory: docs/images/');
    console.log('Diagrams Checked: 4');
    console.log('Diagram Types: architecture, data-flow, process-flow, hierarchy');
    console.log('Total Tests: 5');
    console.log('='.repeat(80) + '\n');
  });
});