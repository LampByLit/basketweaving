import { Post } from '@/types/4chan';
import { GetMatch } from './monitor';
import chalk from 'chalk';

export class BoardLogger {
  private lastCheckTime: number = Date.now();
  private postCount: number = 0;

  constructor(private board: string) {}

  private getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  private formatPostNumber(number: number): string {
    return chalk.cyan(`#${number.toString().padStart(8, '0')}`);
  }

  private formatGetMatch(match: GetMatch): string {
    const getTypeColors = {
      dubs: chalk.yellow,
      trips: chalk.magenta,
      quads: chalk.red,
      quints: chalk.green
    };

    const color = getTypeColors[match.type];
    return `${color(match.type.toUpperCase())} ${this.formatPostNumber(match.number)}`;
  }

  public logCheck() {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    this.lastCheckTime = now;

    console.log(
      chalk.gray(`[${this.getTimestamp()}] `) +
      chalk.blue(`Checking /${this.board}/ `) +
      chalk.gray(`(${timeSinceLastCheck}ms since last check)`)
    );
  }

  public logNewPost(post: Post) {
    this.postCount++;
    console.log(
      chalk.gray(`[${this.getTimestamp()}] `) +
      chalk.green('New post: ') +
      this.formatPostNumber(post.no) +
      (post.com ? chalk.gray(` - ${post.com.slice(0, 50)}${post.com.length > 50 ? '...' : ''}`) : '')
    );
  }

  public logGet(match: GetMatch) {
    console.log(
      chalk.gray(`[${this.getTimestamp()}] `) +
      chalk.bold('GET! ') +
      this.formatGetMatch(match)
    );
  }

  public logError(error: Error) {
    console.error(
      chalk.gray(`[${this.getTimestamp()}] `) +
      chalk.red('Error: ') +
      error.message
    );
  }

  public getStats(): string {
    return chalk.gray(`Posts seen: ${this.postCount}`);
  }
} 