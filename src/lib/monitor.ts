import { getLatestPosts } from './4chan-api';
import type { Post } from '@/types/4chan';
import { GET_PATTERNS } from './4chan-api';
import { BoardLogger } from './logger';

export interface GetMatch {
  type: keyof typeof GET_PATTERNS;
  post: Post;
  number: number;
  previousNumber: number;
}

export interface MonitorConfig {
  board: string;
  onGet?: (match: GetMatch) => void;
  onNewPost?: (post: Post) => void;
  interval?: number;
}

export class Monitor {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private lastPostNumber = 0;
  private logger: BoardLogger;
  private consecutiveErrors = 0;
  private lastCheckTime = 0;
  private isFirstCheck = true;
  private targetInterval = 1000; // Target 1 second between checks

  constructor(private config: MonitorConfig) {
    this.targetInterval = this.config.interval || 1000; // Default 1 second interval
    this.logger = new BoardLogger(config.board);
  }

  private checkForGets(post: Post): GetMatch | null {
    const postNumber = post.no;
    
    // Check each GET pattern
    for (const [type, { pattern, previous }] of Object.entries(GET_PATTERNS)) {
      if (pattern.test(String(postNumber))) {
        // Find the previous post number that didn't match the pattern
        const previousNumber = this.lastPostNumber;
        if (previous.test(String(previousNumber))) {
          return {
            type: type as keyof typeof GET_PATTERNS,
            post,
            number: postNumber,
            previousNumber
          };
        }
      }
    }
    
    return null;
  }

  private async checkPosts() {
    try {
      const now = Date.now();
      const timeSinceLastCheck = now - this.lastCheckTime;
      this.lastCheckTime = now;

      // Check if we're being rate limited (429 status code)
      if (this.consecutiveErrors > 3) {
        this.logger.logError(new Error('Possible rate limiting detected. Waiting 30 seconds...'));
        await new Promise(resolve => setTimeout(resolve, 30000));
        this.consecutiveErrors = 0;
        return;
      }

      this.logger.logCheck();
      const posts = await getLatestPosts(this.config.board);
      
      // Reset error counter on successful request
      this.consecutiveErrors = 0;
      
      // On first check, just establish the baseline
      if (this.isFirstCheck) {
        if (posts.length > 0) {
          this.lastPostNumber = posts[0].no;
          this.logger.logNewPost(posts[0]);
        }
        this.isFirstCheck = false;
        return;
      }
      
      // Process posts in reverse order (newest first)
      for (const post of posts.reverse()) {
        // Only process posts newer than our last seen post
        if (post.no <= this.lastPostNumber) {
          continue;
        }

        // Update last post number
        this.lastPostNumber = post.no;
        
        // Check for GETs
        const getMatch = this.checkForGets(post);
        if (getMatch) {
          this.logger.logGet(getMatch);
          if (this.config.onGet) {
            this.config.onGet(getMatch);
          }
        }
        
        // Log and notify of new post
        this.logger.logNewPost(post);
        if (this.config.onNewPost) {
          this.config.onNewPost(post);
        }
      }
    } catch (error) {
      this.consecutiveErrors++;
      this.logger.logError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      // Schedule next check to maintain consistent interval
      if (this.isRunning) {
        const elapsed = Date.now() - this.lastCheckTime;
        const delay = Math.max(0, this.targetInterval - elapsed);
        this.intervalId = setTimeout(() => this.checkPosts(), delay);
      }
    }
  }

  public start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastCheckTime = Date.now();
    this.isFirstCheck = true;
    this.checkPosts(); // Initial check
  }

  public stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = undefined;
    }
  }
} 