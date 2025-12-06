// Bundle Analysis Script for POZIMIND
// Analyzes the built bundle for size optimization opportunities

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const DIST_DIR = path.join(__dirname, '../dist');
const ANALYSIS_FILE = path.join(__dirname, '../bundle-analysis.json');

function analyzeBundle() {
  console.log('🔍 Analyzing POZIMIND bundle...\n');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const analysis = {
    timestamp: new Date().toISOString(),
    files: [],
    totalSize: 0,
    totalGzipSize: 0,
    recommendations: []
  };

  // Analyze all files in dist directory
  function analyzeDirectory(dir, relativePath = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      const relativeFilePath = path.join(relativePath, file);
      
      if (stats.isDirectory()) {
        analyzeDirectory(fullPath, relativeFilePath);
      } else {
        const content = fs.readFileSync(fullPath);
        const size = stats.size;
        const gzipSize = gzipSync(content).length;
        
        const fileAnalysis = {
          path: relativeFilePath,
          size: size,
          sizeFormatted: formatBytes(size),
          gzipSize: gzipSize,
          gzipSizeFormatted: formatBytes(gzipSize),
          type: getFileType(file)
        };
        
        analysis.files.push(fileAnalysis);
        analysis.totalSize += size;
        analysis.totalGzipSize += gzipSize;
        
        // Check for optimization opportunities
        checkOptimizationOpportunities(fileAnalysis, analysis);
      }
    });
  }

  analyzeDirectory(DIST_DIR);

  // Sort files by size
  analysis.files.sort((a, b) => b.size - a.size);

  // Generate recommendations
  generateRecommendations(analysis);

  // Save analysis to file
  fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(analysis, null, 2));

  // Print summary
  printSummary(analysis);
}

function getFileType(filename) {
  const ext = path.extname(filename);
  switch (ext) {
    case '.js':
      return 'javascript';
    case '.css':
      return 'stylesheet';
    case '.html':
      return 'html';
    case '.svg':
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.webp':
      return 'image';
    case '.woff':
    case '.woff2':
    case '.ttf':
    case '.eot':
      return 'font';
    default:
      return 'other';
  }
}

function checkOptimizationOpportunities(file, analysis) {
  // Large files
  if (file.size > 500000) { // > 500KB
    analysis.recommendations.push({
      type: 'large-file',
      severity: 'high',
      file: file.path,
      message: `Large file detected (${file.sizeFormatted}). Consider code splitting or lazy loading.`,
      size: file.size
    });
  }

  // JavaScript files that could be minified further
  if (file.type === 'javascript' && file.size > 100000) {
    const filename = file.path.toLowerCase();
    if (!filename.includes('.min.') && !filename.includes('.chunk.')) {
      analysis.recommendations.push({
        type: 'minification',
        severity: 'medium',
        file: file.path,
        message: `JavaScript file could benefit from additional minification.`,
        size: file.size
      });
    }
  }

  // Poor gzip compression
  if (file.size > 10000) {
    const compressionRatio = file.gzipSize / file.size;
    if (compressionRatio > 0.8) {
      analysis.recommendations.push({
        type: 'compression',
        severity: 'medium',
        file: file.path,
        message: `Poor gzip compression ratio (${(compressionRatio * 100).toFixed(1)}%). File may not compress well.`,
        compressionRatio: compressionRatio
      });
    }
  }

  // Large images
  if (file.type === 'image' && file.size > 100000) {
    analysis.recommendations.push({
      type: 'image-optimization',
      severity: 'medium',
      file: file.path,
      message: `Large image detected (${file.sizeFormatted}). Consider compression or format conversion.`,
      size: file.size
    });
  }
}

function generateRecommendations(analysis) {
  // General recommendations based on overall analysis
  if (analysis.totalSize > 3000000) { // > 3MB
    analysis.recommendations.push({
      type: 'bundle-size',
      severity: 'high',
      message: `Total bundle size is large (${formatBytes(analysis.totalSize)}). Consider aggressive code splitting.`,
      size: analysis.totalSize
    });
  }

  // Check for too many chunks
  const jsFiles = analysis.files.filter(f => f.type === 'javascript');
  if (jsFiles.length > 20) {
    analysis.recommendations.push({
      type: 'chunk-optimization',
      severity: 'low',
      message: `High number of JavaScript chunks (${jsFiles.length}). Consider consolidating smaller chunks.`,
      count: jsFiles.length
    });
  }

  // Check for vendor chunk size
  const vendorChunks = jsFiles.filter(f => f.path.includes('vendor') || f.path.includes('node_modules'));
  vendorChunks.forEach(chunk => {
    if (chunk.size > 300000) { // > 300KB
      analysis.recommendations.push({
        type: 'vendor-optimization',
        severity: 'medium',
        file: chunk.path,
        message: `Large vendor chunk (${chunk.sizeFormatted}). Consider tree shaking or alternative libraries.`,
        size: chunk.size
      });
    }
  });
}

function printSummary(analysis) {
  console.log('📊 Bundle Analysis Summary\n');
  console.log(`📦 Total Size: ${formatBytes(analysis.totalSize)}`);
  console.log(`🗜️  Total Gzipped: ${formatBytes(analysis.totalGzipSize)}`);
  console.log(`📁 Files: ${analysis.files.length}`);
  console.log(`📄 JavaScript: ${analysis.files.filter(f => f.type === 'javascript').length}`);
  console.log(`🎨 CSS: ${analysis.files.filter(f => f.type === 'stylesheet').length}`);
  console.log(`🖼️  Images: ${analysis.files.filter(f => f.type === 'image').length}`);
  console.log(`🔤 Fonts: ${analysis.files.filter(f => f.type === 'font').length}`);

  console.log('\n📋 Largest Files:');
  analysis.files.slice(0, 10).forEach((file, index) => {
    const compressionRatio = ((file.gzipSize / file.size) * 100).toFixed(1);
    console.log(`  ${index + 1}. ${file.path} - ${file.sizeFormatted} (${file.gzipSizeFormatted} gzipped, ${compressionRatio}% compression)`);
  });

  if (analysis.recommendations.length > 0) {
    console.log('\n⚠️  Optimization Recommendations:');
    
    const highSeverity = analysis.recommendations.filter(r => r.severity === 'high');
    const mediumSeverity = analysis.recommendations.filter(r => r.severity === 'medium');
    const lowSeverity = analysis.recommendations.filter(r => r.severity === 'low');

    if (highSeverity.length > 0) {
      console.log('\n  🔴 High Priority:');
      highSeverity.forEach(rec => {
        console.log(`    • ${rec.message}`);
        if (rec.file) console.log(`      File: ${rec.file}`);
      });
    }

    if (mediumSeverity.length > 0) {
      console.log('\n  🟡 Medium Priority:');
      mediumSeverity.forEach(rec => {
        console.log(`    • ${rec.message}`);
        if (rec.file) console.log(`      File: ${rec.file}`);
      });
    }

    if (lowSeverity.length > 0) {
      console.log('\n  🟢 Low Priority:');
      lowSeverity.forEach(rec => {
        console.log(`    • ${rec.message}`);
        if (rec.file) console.log(`      File: ${rec.file}`);
      });
    }
  }

  console.log('\n💡 Performance Tips:');
  console.log('  • Enable Brotli compression for better ratios than gzip');
  console.log('  • Implement resource hints (preload, prefetch)');
  console.log('  • Use HTTP/2 for multiplexing');
  console.log('  • Consider service worker caching strategies');
  console.log('  • Monitor Core Web Vitals in production');

  console.log(`\n📄 Detailed analysis saved to: ${ANALYSIS_FILE}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run analysis if called directly
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };
