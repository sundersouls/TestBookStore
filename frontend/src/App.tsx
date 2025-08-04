import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Card,
  CardMedia,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  ThemeProvider,
  CssBaseline,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  Casino,
  DarkMode,
  LightMode,
  Download
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { getTheme } from './theme'; 

interface Review {
  reviewer: string;
  rating: number;
  text: string;
  date: string;
}

interface CoverImage {
  imageUrl: string;
  title: string;
  author: string;
}

interface Book {
  index: number;
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  year: number;
  likes: number;
  reviews: Review[];
  coverImage: CoverImage;
}

interface BookRequest {
  page: number;
  locale: string;
  seed: number;
  avgLikes: number;
  avgReviews: number;
}

interface BookResponse {
  books: Book[];
  page: number;
  hasMore: boolean;
}

class BookService {
  private baseUrl = process.env.REACT_APP_API_URL;

  async getBooks(request: BookRequest): Promise<BookResponse> {
    const response = await fetch(`${this.baseUrl}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

interface BookCoverProps {
  coverData: CoverImage;
}

const BookCover: React.FC<BookCoverProps> = ({ coverData }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Card sx={{ width: 160, height: 240, m: 2, position: 'relative' }}>
      <Box sx={{ position: 'relative', width: '100%', height: 240 }}>
        {!imageLoaded && !imageError && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.200'
          }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <CardMedia
          component="img"
          sx={{
            height: 240,
            width: '100%',
            objectFit: 'cover',
            display: imageError ? 'none' : 'block',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          image={coverData.imageUrl}
          alt={`Cover of ${coverData.title}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
        
        {imageError && (
          <Box sx={{
            height: 240,
            backgroundColor: 'grey.300',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'text.secondary',
            textAlign: 'center',
            p: 2,
          }}>
            <Typography variant="body2" sx={{ fontSize: '12px', mb: 1 }}>
              Cover Not Available
            </Typography>
          </Box>
        )}
        
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          color: 'white',
          p: 1,
          textAlign: 'center'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '11px', 
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              display: 'block',
              lineHeight: 1.2
            }}
          >
            {coverData.title}
          </Typography>
                        <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '10px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              opacity: 0.9
            }}
          >
            {coverData.author}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

interface BookRowProps {
  book: Book;
  expanded: boolean;
  onToggle: () => void;
}

const BookRow: React.FC<BookRowProps> = ({ book, expanded, onToggle }) => (
  <>
    <TableRow 
      hover 
      onClick={onToggle}
      sx={{ 
        cursor: 'pointer', 
        '&:hover': { backgroundColor: 'action.hover' },
        transition: 'background-color 0.2s'
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" sx={{ mr: 1 }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          {book.index}
        </Box>
      </TableCell>
      <TableCell>{book.isbn}</TableCell>
      <TableCell>{book.title}</TableCell>
      <TableCell>{book.authors.join(', ')}</TableCell>
      <TableCell>{`${book.publisher}, ${book.year}`}</TableCell>
    </TableRow>
    <TableRow>
      <TableCell colSpan={5} sx={{ p: 0 }}>
        <Collapse in={expanded}>
          <Box sx={{ p: 3, backgroundColor: 'action.selected' }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flexShrink: 0 }}>
                <BookCover coverData={book.coverImage} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="h6" gutterBottom>
                  Book Details
                </Typography>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${book.likes} likes`} 
                    color="primary" 
                    size="small"
                  />
                  <Chip 
                    label={`${book.reviews.length} reviews`} 
                    color="secondary" 
                    size="small"
                  />
                </Box>
                
                {book.reviews.length > 0 ? (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Reviews
                    </Typography>
                    {book.reviews.map((review, idx) => (
                      <Paper key={idx} sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {review.reviewer}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={review.rating} size="small" readOnly />
                            <Typography variant="caption" color="text.secondary">
                              {review.date}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2">
                          {review.text}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No reviews available
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  </>
);

const AppContent: React.FC = () => {
  const [locale, setLocale] = useState<string>('en-US');
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 100000000));
  const [avgLikes, setAvgLikes] = useState<number>(Math.round(Math.random() * 100) / 10);
  const [avgReviews, setAvgReviews] = useState<number>(Math.round(Math.random() * 50) / 10);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<boolean>(false);
  const bookService = useRef(new BookService()).current;

  const locales = [
    { code: 'en-US', label: 'English (USA)' },
    { code: 'de-DE', label: 'German (Germany)' },
    { code: 'ja-JP', label: 'Japanese (Japan)' }
  ];

  const loadBooks = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookService.getBooks({
        page: pageNum,
        locale,
        seed,
        avgLikes,
        avgReviews
      });
      
      if (reset) {
        setBooks(response.books);
        setPage(0);
        setExpandedRows(new Set());
      } else {
        setBooks(prev => [...prev, ...response.books]);
        setPage(pageNum);
      }
      
      setHasMore(response.hasMore);
    } catch (err) {
      setError('Failed to load books.');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [locale, seed, avgLikes, avgReviews, bookService]);

  useEffect(() => {
    loadBooks(0, true);
  }, []);

  const [isInitialMount, setIsInitialMount] = useState(true);
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    
    setBooks([]);
    setPage(0);
    setExpandedRows(new Set());
    setHasMore(true);
    loadBooks(0, true);
  }, [locale, seed, avgLikes, avgReviews]); 

  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current || loadingRef.current || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
      
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadBooks(page + 1);
      }
    };

    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('scroll', handleScroll);
      return () => tableElement.removeEventListener('scroll', handleScroll);
    }
  }, [page, hasMore, loadBooks]);

  const handleExpandRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const generateRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 100000000);
    setSeed(newSeed);
  };

  const exportToCSV = () => {
    if (books.length === 0) {
      alert('No data to export');
      return;
    }

    const csvData = books.map(book => ({
      Index: book.index,
      ISBN: book.isbn,
      Title: book.title,
      Authors: book.authors.join('; '),
      Publisher: book.publisher,
      Year: book.year,
      Likes: book.likes,
      ReviewCount: book.reviews.length,
      AverageRating: book.reviews.length > 0 
        ? (book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length).toFixed(2)
        : 'N/A',
      Reviews: book.reviews.map(r => `${r.reviewer} (${r.rating}★): ${r.text}`).join(' | ')
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const csvContent = [
      headers,
      ...csvData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `books_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const resetData = () => {
    setBooks([]);
    setPage(0);
    setExpandedRows(new Set());
    setHasMore(true);
    loadBooks(0, true);
  };

  const handleLocaleChange = (event: SelectChangeEvent) => {
    setLocale(event.target.value);
  };

  const handleSeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeed(Number(event.target.value));
  };

  const handleAvgLikesChange = (_event: Event, value: number | number[]) => {
    setAvgLikes(value as number);
  };

  const handleAvgReviewsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvgReviews(Number(event.target.value));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 2 }}>
        Book Store Testing Application
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-end' }}>
          <Box sx={{ minWidth: 200, flex: '1 1 auto' }}>
            <FormControl fullWidth>
              <InputLabel>Language & Region</InputLabel>
              <Select 
                value={locale} 
                onChange={handleLocaleChange} 
                label="Language & Region"
                sx={{mb:2}}
              >
                {locales.map(loc => (
                  <MenuItem key={loc.code} value={loc.code}>
                    {loc.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, minWidth: 150 }}>
            <TextField
              label="Seed"
              type="number"
              value={seed}
              onChange={handleSeedChange}
              sx={{ width: 120, mb:2 }}
            />
            <IconButton 
              onClick={generateRandomSeed} 
              title="Generate Random Seed"
              sx={{ mb: 2 }}
            >
              <Casino />
            </IconButton>
          </Box>
          
          <Box sx={{ minWidth: 250, flex: '1 1 auto' }}>
            <Typography gutterBottom>
              Average Likes per Book: {avgLikes.toFixed(1)}
            </Typography>
            <Slider
              value={avgLikes}
              onChange={handleAvgLikesChange}
              min={0}
              max={10}
              step={0.1}
              marks={[
                { value: 0, label: '0' },
                { value: 2.5, label: '2.5' },
                { value: 5, label: '5' },
                { value: 7.5, label: '7.5' },
                { value: 10, label: '10' }
              ]}
            />
          </Box>
          
          <Box sx={{ minWidth: 200 }}>
            <TextField
              label="Average Reviews per Book"
              type="number"
              value={avgReviews}
              onChange={handleAvgReviewsChange}
              inputProps={{ min: 0, max: 20, step: 0.1 }}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Box>
          
          <Box sx={{ minWidth: 140 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={resetData}
              disabled={loading}
              fullWidth
              sx={{ height: 56, mb: 2 }}
            >
              Refresh
            </Button>
          </Box>
          
          <Box sx={{ minWidth: 140 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToCSV}
              disabled={loading || books.length === 0}
              fullWidth
              sx={{ height: 56, mb: 2 }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer 
        component={Paper} 
        ref={tableRef}
        sx={{ maxHeight: 600, overflow: 'auto' }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Index</TableCell>
              <TableCell>ISBN</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Author(s)</TableCell>
              <TableCell>Publisher</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <BookRow
                key={book.index}
                book={book}
                expanded={expandedRows.has(book.index)}
                onToggle={() => handleExpandRow(book.index)}
              />
            ))}
          </TableBody>
        </Table>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!hasMore && books.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
            No more books to load
          </Typography>
        )}
      </TableContainer>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Total books loaded: {books.length} | {hasMore ? 'Scroll down to load more books' : 'All books loaded'}
      </Typography>
    </Container>
  );
};

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const theme = getTheme(darkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <IconButton
          onClick={() => setDarkMode(!darkMode)}
          color="inherit"
          title="Toggle Dark Mode"
          sx={{ mb: 1 }}
        >
          {darkMode ? <DarkMode /> : <LightMode />}
        </IconButton>
      </Box>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;