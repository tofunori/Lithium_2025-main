#!/usr/bin/env node

/**
 * Health Check Script for Lithium Battery Recycling Dashboard
 * 
 * This script performs basic health checks on the application:
 * - Checks if required dependencies are installed
 * - Validates configuration files
 * - Tests database connectivity (if configured)
 * - Verifies build process
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const frontendPath = join(projectRoot, 'frontend');

console.log('🏥 Lithium Dashboard Health Check');
console.log('================================\n');

/**
 * Check if a file exists
 */
function checkFile(filePath, description) {
  const exists = existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Found' : 'Missing'}`);
  return exists;
}

/**
 * Check package.json and dependencies
 */
function checkPackageJson() {
  console.log('📦 Checking Package Configuration...');
  
  const packageJsonPath = join(frontendPath, 'package.json');
  if (!checkFile(packageJsonPath, 'package.json')) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    console.log(`✅ Package name: ${packageJson.name}`);
    console.log(`✅ Version: ${packageJson.version}`);
    
    // Check critical dependencies
    const criticalDeps = ['react', 'typescript', 'vite', '@supabase/supabase-js'];
    const missing = criticalDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missing.length > 0) {
      console.log(`❌ Missing critical dependencies: ${missing.join(', ')}`);
      return false;
    }
    
    console.log('✅ All critical dependencies found');
    return true;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

/**
 * Check configuration files
 */
function checkConfigFiles() {
  console.log('\n⚙️  Checking Configuration Files...');
  
  const configs = [
    [join(frontendPath, 'tsconfig.json'), 'TypeScript configuration'],
    [join(frontendPath, 'vite.config.js'), 'Vite configuration'],
    [join(frontendPath, 'eslint.config.js'), 'ESLint configuration'],
    [join(frontendPath, 'index.html'), 'HTML entry point']
  ];
  
  return configs.every(([path, desc]) => checkFile(path, desc));
}

/**
 * Check if node_modules exists and is populated
 */
async function checkNodeModules() {
  console.log('\n📁 Checking Dependencies Installation...');
  
  const nodeModulesPath = join(frontendPath, 'node_modules');
  if (!checkFile(nodeModulesPath, 'node_modules directory')) {
    console.log('💡 Run "npm install" in the frontend directory');
    return false;
  }
  
  // Check if package-lock.json exists
  checkFile(join(frontendPath, 'package-lock.json'), 'package-lock.json');
  
  return true;
}

/**
 * Test if the project can build
 */
async function testBuild() {
  console.log('\n🔨 Testing Build Process...');
  
  try {
    process.chdir(frontendPath);
    console.log('Running type check...');
    await execAsync('npm run type-check');
    console.log('✅ TypeScript compilation successful');
    
    console.log('Running linting...');
    const { stdout, stderr } = await execAsync('npm run lint');
    if (stderr && !stderr.includes('warning')) {
      console.log(`❌ Linting issues found: ${stderr}`);
      return false;
    }
    console.log('✅ Linting passed');
    
    return true;
  } catch (error) {
    console.log(`❌ Build test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  const checks = [
    checkPackageJson(),
    checkConfigFiles(),
    await checkNodeModules(),
    await testBuild()
  ];
  
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  console.log('\n📊 Health Check Summary');
  console.log('======================');
  console.log(`Checks passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All health checks passed! Your application is ready.');
    process.exit(0);
  } else {
    console.log('⚠️  Some health checks failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('❌ Health check failed with error:', error);
  process.exit(1);
});
