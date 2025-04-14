import axios from 'axios';
import type { Board, Thread, Post, Catalog } from '@/types/4chan';

const API_BASE = 'https://a.4cdn.org';
const IMAGE_BASE = 'https://i.4cdn.org';
const THUMB_BASE = 'https://t.4cdn.org';

// Rate limiting - 1 request per second
const RATE_LIMIT = 1000;
let lastRequest = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequest;
  if (timeSinceLastRequest < RATE_LIMIT) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT - timeSinceLastRequest));
  }
  lastRequest = Date.now();
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function getBoards(): Promise<Board[]> {
  try {
    await rateLimit();
    const response = await axios.get(`${API_BASE}/boards.json`);
    return response.data.boards;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(`Failed to fetch boards: ${error.message}`, error.response?.status);
    }
    throw error;
  }
}

export async function getCatalog(board: string): Promise<Catalog[]> {
  try {
    await rateLimit();
    const response = await axios.get(`${API_BASE}/${board}/catalog.json`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(`Failed to fetch catalog for /${board}/: ${error.message}`, error.response?.status);
    }
    throw error;
  }
}

export async function getThread(board: string, threadId: number): Promise<Thread> {
  try {
    await rateLimit();
    const response = await axios.get(`${API_BASE}/${board}/thread/${threadId}.json`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ApiError(`Failed to fetch thread ${threadId} from /${board}/: ${error.message}`, error.response?.status);
    }
    throw error;
  }
}

export async function getLatestPosts(board: string): Promise<Post[]> {
  try {
    const catalog = await getCatalog(board);
    // Get the first page's threads
    const firstPage = catalog[0];
    if (!firstPage?.threads) {
      throw new ApiError('No threads found on first page');
    }
    
    // Sort threads by last_modified
    const sortedThreads = [...firstPage.threads].sort((a, b) => b.last_modified - a.last_modified);
    
    // Get the most recently modified thread
    const latestThread = sortedThreads[0];
    if (!latestThread) {
      throw new ApiError('No threads found');
    }
    
    // Get the full thread data
    const fullThread = await getThread(board, latestThread.no);
    
    // Return the posts sorted by number
    return fullThread.posts.sort((a, b) => b.no - a.no);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      throw new ApiError(`Failed to fetch latest posts from /${board}/: ${error.message}`, error.response?.status);
    }
    throw error;
  }
}

export function getImageUrl(board: string, tim: number, ext: string): string {
  return `${IMAGE_BASE}/${board}/${tim}${ext}`;
}

export function getThumbnailUrl(board: string, tim: number): string {
  return `${THUMB_BASE}/${board}/${tim}s.jpg`;
}

// GET detection patterns
export const GET_PATTERNS = {
  dubs: {
    type: 'dubs',
    pattern: /\d*(\d)\1$/,
    previous: /\d*(\d)(?!\1)$/
  },
  trips: {
    type: 'trips',
    pattern: /\d*(\d)\1\1$/,
    previous: /\d*(\d)(?!\1)$/
  },
  quads: {
    type: 'quads',
    pattern: /\d*(\d)\1\1\1$/,
    previous: /\d*(\d)(?!\1)$/
  },
  quints: {
    type: 'quints',
    pattern: /\d*(\d)\1\1\1\1$/,
    previous: /\d*(\d)(?!\1)$/
  }
} as const; 