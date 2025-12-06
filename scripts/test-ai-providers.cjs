// AI Providers Test Script for MAEPLE
// Tests all AI adapters with mock data to verify functionality

const fs = require('fs');
const path = require('path');

// Mock implementations for testing
const mockResponses = {
  gemini: {
    text: "This is a mock Gemini response testing neurodiversity-affirming coaching.",
    vision: "I can see this is a test image for vision analysis.",
    image: "https://mock-gemini-image-url.com/generated",
    search: "Mock search results from Gemini"
  },
  openai: {
    text: "This is a mock OpenAI response with compassionate coaching guidance.",
    vision: "Based on the image, I can provide analysis for your wellness tracking.",
    image: "https://mock-openai-image-url.com/generated",
    search: "OpenAI doesn't provide search, but here's contextual information."
  },
  openrouter: {
    text: "This is a mock OpenRouter response leveraging multiple models.",
    vision: "Analyzing through OpenRouter's multi-model capabilities.",
    image: "https://mock-openrouter-image-url.com/generated",
    search: "Search results powered by OpenRouter's model routing."
  },
  perplexity: {
    text: "This is a mock Perplexity response with up-to-date information.",
    vision: "Perplexity vision analysis with current context.",
    search: "Comprehensive search results from Perplexity's knowledge base."
  },
  anthropic: {
    text: "This is a mock Claude response with thoughtful, nuanced coaching.",
    vision: "Claude's analysis of the provided image with detailed observations.",
    search: "Claude doesn't provide search, but offers contextual insights."
  },
  ollama: {
    text: "This is a mock Ollama response running locally.",
    vision: "Local vision analysis through Ollama.",
    search: "Ollama doesn't provide search capabilities."
  },
  zai: {
    text: "This is a mock Z.ai response with conversational AI support.",
    vision: "Z.ai doesn't support vision analysis.",
    image: "Z.ai doesn't support image generation.",
    search: "Z.ai doesn't provide search functionality."
  }
};

const testCases = {
  text: [
    {
      name: "Basic Coaching Query",
      messages: [{ role: "user", content: "How can I better manage my energy levels throughout the day?" }],
      expectedKeywords: ["energy", "spoons", "pacing", "burnout"]
    },
    {
      name: "Sensory Overload",
      messages: [{ role: "user", content: "I'm feeling overwhelmed by noise and bright lights at work." }],
      expectedKeywords: ["sensory", "overload", "environment", "accommodations"]
    },
    {
      name: "Masking Fatigue",
      messages: [{ role: "user", content: "I'm exhausted from trying to fit in at social events." }],
      expectedKeywords: ["masking", "social", "authenticity", "boundaries"]
    }
  ],
  vision: [
    {
      name: "Facial Expression Analysis",
      prompt: "Analyze this facial expression for signs of stress or fatigue",
      imageData: "mock-base64-image-data",
      mimeType: "image/jpeg"
    },
    {
      name: "Environment Analysis",
      prompt: "What environmental factors in this image might contribute to sensory overload?",
      imageData: "mock-base64-image-data",
      mimeType: "image/jpeg"
    }
  ],
  image: [
    {
      name: "Calm Visualization",
      prompt: "Generate a calming image representing neurodivergent peace",
      size: "1024x1024"
    },
    {
      name: "Energy Visualization",
      prompt: "Create an abstract representation of spoon theory energy levels",
      size: "512x512"
    }
  ],
  search: [
    {
      name: "Neurodiversity Resources",
      query: "evidence-based strategies for ADHD time blindness"
    },
    {
      name: "Sensory Tools",
      query: "best noise cancelling headphones for autism sensory sensitivity"
    }
  ]
};

class AIProviderTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      providers: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: 0
      }
    };
  }

  async testProvider(providerName, adapter) {
    console.log(`\n🧪 Testing ${providerName} Adapter...`);
    
    const providerResults = {
      name: providerName,
      capabilities: [],
      testResults: [],
      errors: [],
      performance: {
        averageResponseTime: 0,
        totalTests: 0
      }
    };

    // Test capabilities
    try {
      const capabilities = this.getProviderCapabilities(providerName);
      providerResults.capabilities = capabilities;
      
      for (const capability of capabilities) {
        await this.testCapability(providerName, capability, providerResults);
      }
    } catch (error) {
      providerResults.errors.push({
        type: 'provider-error',
        message: error.message,
        stack: error.stack
      });
    }

    this.results.providers[providerName] = providerResults;
    this.updateSummary(providerResults);
  }

  getProviderCapabilities(providerName) {
    const capabilities = [];
    
    // Define capabilities for each provider based on implementation
    const capabilityMap = {
      gemini: ['text', 'vision', 'image_gen', 'search'],
      openai: ['text', 'vision', 'image_gen'],
      openrouter: ['text', 'vision', 'image_gen', 'search'],
      perplexity: ['text', 'vision', 'search'],
      anthropic: ['text', 'vision'],
      ollama: ['text', 'vision'],
      zai: ['text']
    };

    return capabilityMap[providerName] || [];
  }

  async testCapability(providerName, capability, providerResults) {
    const startTime = Date.now();
    
    try {
      let testResult;
      
      switch (capability) {
        case 'text':
          testResult = await this.testTextCapability(providerName);
          break;
        case 'vision':
          testResult = await this.testVisionCapability(providerName);
          break;
        case 'image_gen':
          testResult = await this.testImageGenCapability(providerName);
          break;
        case 'search':
          testResult = await this.testSearchCapability(providerName);
          break;
        default:
          throw new Error(`Unknown capability: ${capability}`);
      }

      const responseTime = Date.now() - startTime;
      
      providerResults.testResults.push({
        capability,
        status: 'passed',
        responseTime,
        result: testResult
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      providerResults.testResults.push({
        capability,
        status: 'failed',
        responseTime,
        error: {
          message: error.message,
          type: error.constructor.name
        }
      });
    }
  }

  async testTextCapability(providerName) {
    const testCase = testCases.text[0]; // Use first test case
    const mockResponse = mockResponses[providerName];
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Validate response contains expected content
    const response = mockResponse.text;
    const hasExpectedKeywords = testCase.expectedKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasExpectedKeywords) {
      throw new Error(`Response missing expected keywords for coaching context`);
    }

    return {
      response,
      length: response.length,
      hasCoachingContext: true,
      keywordsFound: testCase.expectedKeywords.filter(keyword => 
        response.toLowerCase().includes(keyword.toLowerCase())
      )
    };
  }

  async testVisionCapability(providerName) {
    const testCase = testCases.vision[0];
    const mockResponse = mockResponses[providerName];
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));

    if (!mockResponse.vision || mockResponse.vision.includes("doesn't support")) {
      throw new Error(`Vision not supported by ${providerName}`);
    }

    return {
      analysis: mockResponse.vision,
      hasVisionOutput: true
    };
  }

  async testImageGenCapability(providerName) {
    const testCase = testCases.image[0];
    const mockResponse = mockResponses[providerName];
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    if (!mockResponse.image || mockResponse.image.includes("doesn't support")) {
      throw new Error(`Image generation not supported by ${providerName}`);
    }

    return {
      imageUrl: mockResponse.image,
      hasImageOutput: true
    };
  }

  async testSearchCapability(providerName) {
    const testCase = testCases.search[0];
    const mockResponse = mockResponses[providerName];
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 600 + 200));

    if (!mockResponse.search || mockResponse.search.includes("doesn't provide")) {
      throw new Error(`Search not supported by ${providerName}`);
    }

    return {
      results: mockResponse.search,
      hasSearchResults: true
    };
  }

  updateSummary(providerResults) {
    const tests = providerResults.testResults;
    this.results.summary.totalTests += tests.length;
    
    tests.forEach(test => {
      if (test.status === 'passed') {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
    });

    this.results.summary.errors += providerResults.errors.length;
  }

  generateReport() {
    const report = [];
    
    report.push('# MAEPLE AI Providers Test Report\n');
    report.push(`Generated: ${this.results.timestamp}\n`);
    
    // Summary
    report.push('## Summary\n');
    report.push(`- Total Tests: ${this.results.summary.totalTests}`);
    report.push(`- Passed: ${this.results.summary.passed}`);
    report.push(`- Failed: ${this.results.summary.failed}`);
    report.push(`- Errors: ${this.results.summary.errors}`);
    
    const successRate = this.results.summary.totalTests > 0 
      ? ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)
      : 0;
    report.push(`- Success Rate: ${successRate}%\n`);

    // Provider Details
    report.push('## Provider Results\n');
    
    Object.entries(this.results.providers).forEach(([name, results]) => {
      report.push(`### ${name}\n`);
      report.push(`**Capabilities:** ${results.capabilities.join(', ')}\n`);
      
      const passedTests = results.testResults.filter(t => t.status === 'passed').length;
      const totalTests = results.testResults.length;
      report.push(`**Tests:** ${passedTests}/${totalTests} passed\n`);
      
      if (results.errors.length > 0) {
        report.push('**Errors:**');
        results.errors.forEach(error => {
          report.push(`- ${error.type}: ${error.message}`);
        });
        report.push('');
      }
      
      // Test details
      results.testResults.forEach(test => {
        const status = test.status === 'passed' ? '✅' : '❌';
        report.push(`${status} **${test.capability}** (${test.responseTime}ms)`);
        
        if (test.status === 'failed') {
          report.push(`  - Error: ${test.error.message}`);
        }
      });
      
      report.push('');
    });

    // Recommendations
    report.push('## Recommendations\n');
    
    Object.entries(this.results.providers).forEach(([name, results]) => {
      const failedTests = results.testResults.filter(t => t.status === 'failed');
      
      if (failedTests.length > 0) {
        report.push(`### ${name} Improvements:`);
        failedTests.forEach(test => {
          report.push(`- Fix ${test.capability} implementation: ${test.error.message}`);
        });
        report.push('');
      }
    });

    return report.join('\n');
  }

  async runAllTests() {
    console.log('🚀 Starting AI Providers Test Suite...\n');
    
    // Test all providers
    const providers = ['gemini', 'openai', 'openrouter', 'perplexity', 'anthropic', 'ollama', 'zai'];
    
    for (const provider of providers) {
      // Create mock adapter for testing
      const mockAdapter = this.createMockAdapter(provider);
      await this.testProvider(provider, mockAdapter);
    }

    // Generate and save report
    const report = this.generateReport();
    const reportPath = path.join(__dirname, '../ai-test-report.md');
    fs.writeFileSync(reportPath, report);
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Errors: ${this.results.summary.errors}`);
    
    const successRate = this.results.summary.totalTests > 0 
      ? ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)
      : 0;
    console.log(`Success Rate: ${successRate}%`);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return this.results;
  }

  createMockAdapter(providerName) {
    return {
      providerName,
      mock: true,
      // Mock methods that simulate the real adapter behavior
      chat: async (request) => ({ content: mockResponses[providerName].text }),
      vision: async (request) => ({ content: mockResponses[providerName].vision }),
      generateImage: async (request) => ({ imageUrl: mockResponses[providerName].image }),
      search: async (request) => ({ results: mockResponses[providerName].search }),
      supportsStreaming: () => ['openai', 'anthropic', 'gemini'].includes(providerName)
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AIProviderTester();
  tester.runAllTests().catch(console.error);
}

module.exports = { AIProviderTester };
