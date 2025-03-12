#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';

const execAsync = promisify(exec);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  try {
    // Get available packages
    const { stdout: packagesOutput } = await execAsync('pnpm ls -r --json');
    const packages = JSON.parse(packagesOutput);
    
    // Filter out private packages
    const publishablePackages = packages.filter(pkg => !pkg.private);
    
    console.log('Available packages for publishing:');
    publishablePackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name} (${pkg.version})`);
    });
    
    const selection = await question('Enter package numbers to publish (comma-separated, e.g. 1,2,3), or "all" for all packages: ');
    
    let selectedPackages = [];
    if (selection.toLowerCase() === 'all') {
      selectedPackages = publishablePackages;
    } else {
      const packageIndexes = selection.split(',').map(index => parseInt(index.trim()) - 1);
      selectedPackages = packageIndexes.map(index => publishablePackages[index]).filter(Boolean);
    }
    
    if (selectedPackages.length === 0) {
      console.log('No packages selected. Exiting.');
      rl.close();
      return;
    }
    
    // Confirm selection
    console.log('\nYou are about to publish the following packages:');
    selectedPackages.forEach(pkg => {
      console.log(`- ${pkg.name} (${pkg.version})`);
    });
    
    const confirmation = await question('\nProceed with publishing? (y/n): ');
    
    if (confirmation.toLowerCase() !== 'y') {
      console.log('Publishing cancelled.');
      rl.close();
      return;
    }
    
    // Build packages
    console.log('\nBuilding selected packages...');
    
    // Create a temporary filter
    const packageFilter = selectedPackages.map(pkg => pkg.name.replace('@', '')).join(',');
    console.log(`Package filter: ${packageFilter}`);
    
    await execAsync(`pnpm turbo run build --filter={${packageFilter}}`);
    
    // Publish packages
    console.log('\nPublishing selected packages...');
    
    for (const pkg of selectedPackages) {
      try {
        console.log(`\nPublishing ${pkg.name}...`);
        const { stdout } = await execAsync(`cd ${pkg.path} && npm publish`);
        console.log(stdout);
      } catch (error) {
        console.error(`Error publishing ${pkg.name}:`, error.message);
      }
    }
    
    console.log('\nPublishing complete!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
