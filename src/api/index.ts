import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data files
const dataPath = join(__dirname, '../data');
const videosPath = join(dataPath, 'videos.json');
const categoriesPath = join(dataPath, 'categories.json');
const tagsPath = join(dataPath, 'tags.json');
const authorsPath = join(dataPath, 'authors.json');

// Helper function to read JSON data
function readJsonFile<T>(filePath: string): T {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [] as T;
  }
}

// API Response format
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Error handling middleware
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.message,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

// Routes
// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Get all videos with pagination, filter, and sort
app.get('/api/videos', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;
  const tag = req.query.tag as string;
  const sortBy = req.query.sort as string;
  const sortOrder = req.query.order as 'asc' | 'desc';

  let videos = readJsonFile<Array<any>>(videosPath);

  // Filter by category
  if (category) {
    videos = videos.filter((v: any) => v.category?.toLowerCase() === category.toLowerCase());
  }

  // Filter by tag
  if (tag) {
    videos = videos.filter((v: any) =>
      v.tags?.some((t: string) => t.toLowerCase() === tag.toLowerCase())
    );
  }

  // Sort
  if (sortBy) {
    videos.sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === 'views') {
        comparison = a.views - b.views;
      } else if (sortBy === 'likes') {
        comparison = a.likes - b.likes;
      } else if (sortBy === 'uploadDate') {
        comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  const total = videos.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedVideos = videos.slice(startIndex, endIndex);

  const response: PaginatedResponse<any> = {
    success: true,
    data: {
      items: paginatedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };

  res.json(response);
});

// Get video by ID
app.get('/api/videos/:id', (req: Request, res: Response) => {
  const videos = readJsonFile<Array<any>>(videosPath);
  const video = videos.find((v: any) => v.id === req.params.id);

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  res.json({
    success: true,
    data: video,
  });
});

// Like video
app.post('/api/videos/:id/like', (req: Request, res: Response) => {
  const videos = readJsonFile<Array<any>>(videosPath);
  const videoIndex = videos.findIndex((v: any) => v.id === req.params.id);

  if (videoIndex === -1) {
    throw new ApiError(404, 'Video not found');
  }

  // Simulate like increment
  videos[videoIndex].likes = (videos[videoIndex].likes || 0) + 1;

  res.json({
    success: true,
    data: { videoId: req.params.id, newLikes: videos[videoIndex].likes },
    message: 'Video liked successfully',
  });
});

// Increment view count
app.post('/api/videos/:id/view', (req: Request, res: Response) => {
  const videos = readJsonFile<Array<any>>(videosPath);
  const videoIndex = videos.findIndex((v: any) => v.id === req.params.id);

  if (videoIndex === -1) {
    throw new ApiError(404, 'Video not found');
  }

  // Simulate view increment
  videos[videoIndex].views = (videos[videoIndex].views || 0) + 1;

  res.json({
    success: true,
    data: { videoId: req.params.id, newViews: videos[videoIndex].views },
    message: 'View count incremented',
  });
});

// Get all categories
app.get('/api/categories', (req: Request, res: Response) => {
  const categories = readJsonFile<Array<any>>(categoriesPath);

  res.json({
    success: true,
    data: categories,
  });
});

// Get videos by category slug
app.get('/api/categories/:slug', (req: Request, res: Response) => {
  const videos = readJsonFile<Array<any>>(videosPath);
  const slug = req.params.slug;

  const categoryVideos = videos.filter(
    (v: any) => v.category?.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
  );

  res.json({
    success: true,
    data: {
      category: slug,
      videos: categoryVideos,
      count: categoryVideos.length,
    },
  });
});

// Get all tags
app.get('/api/tags', (req: Request, res: Response) => {
  const tags = readJsonFile<Array<any>>(tagsPath);

  res.json({
    success: true,
    data: tags,
  });
});

// Get videos by tag slug
app.get('/api/tags/:slug', (req: Request, res: Response) => {
  const videos = readJsonFile<Array<any>>(videosPath);
  const slug = req.params.slug;

  const tagVideos = videos.filter((v: any) =>
    v.tags?.some((t: string) => t.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase())
  );

  res.json({
    success: true,
    data: {
      tag: slug,
      videos: tagVideos,
      count: tagVideos.length,
    },
  });
});

// Get author by name
app.get('/api/authors/:name', (req: Request, res: Response) => {
  const authors = readJsonFile<Array<any>>(authorsPath);
  const authorName = req.params.name;

  const author = authors.find(
    (a: any) => a.name.toLowerCase() === authorName.toLowerCase()
  );

  if (!author) {
    throw new ApiError(404, 'Author not found');
  }

  res.json({
    success: true,
    data: author,
  });
});

// Search videos
app.get('/api/search', (req: Request, res: Response) => {
  const query = (req.query.q as string).toLowerCase().trim();

  if (!query) {
    throw new ApiError(400, 'Search query is required');
  }

  const videos = readJsonFile<Array<any>>(videosPath);

  const results = videos.filter(
    (v: any) =>
      v.title?.toLowerCase().includes(query) ||
      v.description?.toLowerCase().includes(query) ||
      v.tags?.some((t: string) => t.toLowerCase().includes(query)) ||
      v.author?.name?.toLowerCase().includes(query)
  );

  res.json({
    success: true,
    data: {
      query,
      results,
      count: results.length,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`viet69 API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app };
