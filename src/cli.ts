#!/usr/bin/env node

import { Monitor } from './lib/monitor';
import { BoardLogger } from './lib/logger';
import { getBoards } from './lib/4chan-api';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let availableBoards: string[] = [];

function printHeader() {
  console.clear();
  console.log(chalk.blue.bold('4chan Board Monitor'));
  console.log(chalk.gray('Press Ctrl+C to exit\n'));
}

function printHelp() {
  console.log(chalk.yellow('\nAvailable commands:'));
  console.log(chalk.gray('  help     - Show this help message'));
  console.log(chalk.gray('  stats    - Show monitoring statistics'));
  console.log(chalk.gray('  clear    - Clear the screen'));
  console.log(chalk.gray('  boards   - List available boards'));
  console.log(chalk.gray('  stop     - Stop monitoring and show commands'));
  console.log(chalk.gray('  exit     - Stop monitoring and exit'));
  console.log(chalk.gray('  <board>  - Start monitoring a board (e.g., "b", "g", "v")\n'));
}

function printBoards() {
  console.log(chalk.yellow('\nAvailable boards:'));
  availableBoards.forEach(board => {
    console.log(chalk.gray(`  /${board}/`));
  });
  console.log();
}

let currentMonitor: Monitor | null = null;

async function validateBoard(board: string): Promise<boolean> {
  if (availableBoards.length === 0) {
    try {
      const boards = await getBoards();
      availableBoards = boards.map(b => b.board);
    } catch (error) {
      console.error(chalk.red('Error fetching boards:'), error);
      return false;
    }
  }
  return availableBoards.includes(board);
}

async function startMonitoring(board: string) {
  if (currentMonitor) {
    currentMonitor.stop();
  }

  const isValid = await validateBoard(board);
  if (!isValid) {
    console.log(chalk.red(`\nError: Board /${board}/ does not exist.`));
    console.log(chalk.yellow('Use the "boards" command to see available boards.'));
    return;
  }

  currentMonitor = new Monitor({
    board,
    interval: 1000
  });

  currentMonitor.start();
  console.log(chalk.green(`\nStarted monitoring /${board}/`));
}

function stopMonitoring() {
  if (currentMonitor) {
    currentMonitor.stop();
    currentMonitor = null;
    console.log(chalk.yellow('\nStopped monitoring.'));
  } else {
    console.log(chalk.yellow('\nNo board is currently being monitored.'));
  }
}

function handleCommand(command: string) {
  const cmd = command.toLowerCase().trim();

  switch (cmd) {
    case 'help':
      printHelp();
      break;
    case 'boards':
      printBoards();
      break;
    case 'stats':
      if (currentMonitor) {
        console.log(chalk.gray('\nMonitoring Statistics:'));
        // Add more stats as needed
      } else {
        console.log(chalk.yellow('\nNo board is currently being monitored'));
      }
      break;
    case 'clear':
      printHeader();
      break;
    case 'stop':
      stopMonitoring();
      printHeader();
      printHelp();
      break;
    case 'exit':
      if (currentMonitor) {
        currentMonitor.stop();
      }
      rl.close();
      process.exit(0);
      break;
    default:
      if (cmd.length > 0) {
        startMonitoring(cmd);
      }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  if (currentMonitor) {
    currentMonitor.stop();
  }
  console.log(chalk.yellow('\n\nStopping monitor...'));
  rl.close();
  process.exit(0);
});

// Main program loop
async function main() {
  printHeader();
  printHelp();

  // Pre-fetch available boards
  try {
    const boards = await getBoards();
    availableBoards = boards.map(b => b.board);
  } catch (error) {
    console.error(chalk.red('Error fetching boards:'), error);
  }

  rl.setPrompt(chalk.blue('monitor> '));
  rl.prompt();

  rl.on('line', (line) => {
    handleCommand(line);
    rl.prompt();
  });
}

main().catch((error) => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
}); 