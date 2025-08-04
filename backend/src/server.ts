import express from 'express';
import cors from 'cors';
import { faker } from '@faker-js/faker';
import Joi from 'joi';

const app = express();
const PORT = 5000;

app.use(cors({
  origin: ['http://localhost:3000','http://frontend:3000','https://fleetbase.paylab.kz'],
  credentials: true,
}));
app.use(express.json());

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

interface BookRequest {
  page: number;
  locale: string;
  seed: number;
  avgLikes: number;
  avgReviews: number;
}

const bookRequestSchema = Joi.object({
  page: Joi.number().integer().min(0).required(),
  locale: Joi.string().valid('en-US', 'de-DE', 'ja-JP').default('en-US'),
  seed: Joi.number().integer().required(),
  avgLikes: Joi.number().min(0).max(10).required(),
  avgReviews: Joi.number().min(0).max(20).required()
});

class BookDataGenerator {
  private locale: string;
  private baseSeed: number;
  private avgLikes: number;
  private avgReviews: number;

  constructor(locale: string = 'en-US', seed: number = 12345, avgLikes: number = 5, avgReviews: number = 4.7) {
    this.locale = locale;
    this.baseSeed = seed;
    this.avgLikes = avgLikes;
    this.avgReviews = avgReviews;
  }

  private setSeedForIndex(index: number): void {
    const paramHash = this.hashParameters();
    const uniqueSeed = this.baseSeed + paramHash + index;
    faker.seed(uniqueSeed);
  }

  private hashParameters(): number {
    let hash = 0;
    const str = `${this.locale}-${this.avgLikes}-${this.avgReviews}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private generateISBN(): string {
    const prefix = faker.helpers.arrayElement(['978', '979']);
    const group = faker.number.int({ min: 0, max: 9 });
    const publisher = faker.number.int({ min: 10, max: 999 });
    const title = faker.number.int({ min: 10, max: 999 });
    const checkDigit = faker.number.int({ min: 0, max: 9 });
    
    return `${prefix}-${group}-${publisher}-${title}-${checkDigit}`;
  }

  private generateReviewText(sentiment: 'positive' | 'neutral' | 'negative'): string {
    const reviews = {
      'en-US': {
        positive: [
          "An absolutely captivating read that kept me turning pages late into the night.",
          "The character development is exceptional and the plot twists are brilliant.",
          "A masterpiece of modern literature that will stay with you long after reading.",
          "Compelling narrative with rich character development and unexpected turns.",
          "This book changed my perspective on life in the most beautiful way.",
          "Couldn't put it down! The pacing is perfect and the ending is satisfying.",
          "Outstanding work! The author's writing style is both engaging and profound.",
          "One of the best books I've read this year. Highly recommended!"
        ],
        neutral: [
          "A decent read with some interesting ideas and solid writing.",
          "The book has its moments but feels a bit predictable at times.",
          "Well-written overall, though some parts could have been tighter.",
          "An okay story that kept me engaged enough to finish it.",
          "Good character development, but the plot felt somewhat familiar.",
          "The writing is competent and the story is adequately told."
        ],
        negative: [
          "Disappointing. The story felt rushed and characters were underdeveloped.",
          "I struggled to get through this book. The pacing was very slow.",
          "Not what I expected. The plot had potential but poor execution.",
          "The writing style didn't work for me and I found it hard to connect.",
          "Confusing storyline and characters that I couldn't relate to.",
          "Had high hopes but this book fell short of expectations."
        ]
      },
      'de-DE': {
        positive: [
          "Ein fesselndes Buch, das mich bis spät in die Nacht wach gehalten hat.",
          "Die Charakterentwicklung ist außergewöhnlich und die Wendungen brillant.",
          "Ein Meisterwerk der modernen Literatur, das lange nachwirkt.",
          "Hervorragende Erzählung mit reicher Charakterentwicklung."
        ],
        neutral: [
          "Ein ordentliches Buch mit interessanten Ideen und solider Schreibweise.",
          "Das Buch hat seine Momente, wirkt aber manchmal etwas vorhersagbar.",
          "Gut geschrieben insgesamt, auch wenn einige Teile straffer hätten sein können."
        ],
        negative: [
          "Enttäuschend. Die Geschichte wirkte gehetzt und die Charaktere unterentwickelt.",
          "Ich hatte Mühe, durch dieses Buch zu kommen. Das Tempo war sehr langsam.",
          "Nicht das, was ich erwartet hatte. Schlechte Umsetzung trotz Potenzial."
        ]
      },
      'ja-JP': {
        positive: [
          "夜遅くまでページをめくり続けた、絶対に魅力的な読み物。",
          "キャラクター開発は例外的で、プロットのひねりは素晴らしい。",
          "読んだ後も長く心に残る現代文学の傑作。"
        ],
        neutral: [
          "興味深いアイデアと堅実な文章でまともな読み物。",
          "この本にはいい瞬間もあるが、時々予測可能に感じる。"
        ],
        negative: [
          "がっかりした。ストーリーが急いでいて、キャラクターが未発達。",
          "この本を読み終えるのに苦労した。ペースが非常に遅い。"
        ]
      }
    };
    
    const localeReviews = reviews[this.locale as keyof typeof reviews] || reviews['en-US'];
    return faker.helpers.arrayElement(localeReviews[sentiment]);
  }

  private determineReviewSentiment(bookLikes: number): 'positive' | 'neutral' | 'negative' {
    const likeRatio = Math.min(bookLikes / 10, 1);
    
    const random = faker.number.float({ min: 0, max: 1 });
    
    if (likeRatio > 0.7) {
      if (random < 0.8) return 'positive';
      if (random < 0.95) return 'neutral';
      return 'negative';
    } else if (likeRatio > 0.4) {
      if (random < 0.5) return 'positive';
      if (random < 0.85) return 'neutral';
      return 'negative';
    } else {
      if (random < 0.2) return 'positive';
      if (random < 0.6) return 'neutral';
      return 'negative';
    }
  }

  private generateRatingFromSentiment(sentiment: 'positive' | 'neutral' | 'negative'): number {
    switch (sentiment) {
      case 'positive':
        return faker.helpers.weightedArrayElement([
          { weight: 60, value: 5 },
          { weight: 30, value: 4 },
          { weight: 10, value: 3 }
        ]);
      case 'neutral':
        return faker.helpers.weightedArrayElement([
          { weight: 50, value: 3 },
          { weight: 25, value: 4 },
          { weight: 25, value: 2 }
        ]);
      case 'negative':
        return faker.helpers.weightedArrayElement([
          { weight: 50, value: 1 },
          { weight: 30, value: 2 },
          { weight: 20, value: 3 }
        ]);
    }
  }

  private capitalizeFirst(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private generateBookTitle(): string {
    const titleTemplates = {
      'en-US': [
        () => `The ${this.capitalizeFirst(faker.word.adjective())} ${this.capitalizeFirst(faker.word.noun())}`,
        () => `${this.capitalizeFirst(faker.word.adjective())} ${this.capitalizeFirst(faker.word.noun())}`,
        () => `A ${this.capitalizeFirst(faker.word.adjective())} ${this.capitalizeFirst(faker.word.noun())}`,
        () => `${this.capitalizeFirst(faker.word.noun())} of ${this.capitalizeFirst(faker.word.noun())}`,
        () => `The ${this.capitalizeFirst(faker.word.noun())}'s ${this.capitalizeFirst(faker.word.noun())}`
      ],
      'de-DE': [
        () => `Der ${this.capitalizeFirst(faker.word.adjective())} ${this.capitalizeFirst(faker.word.noun())}`,
        () => `Die ${this.capitalizeFirst(faker.word.adjective())}e ${this.capitalizeFirst(faker.word.noun())}`,
        () => `Das ${this.capitalizeFirst(faker.word.adjective())}e ${this.capitalizeFirst(faker.word.noun())}`,
        () => `Im ${this.capitalizeFirst(faker.word.noun())} der ${this.capitalizeFirst(faker.word.noun())}`
      ],
      'ja-JP': [
        () => `${this.capitalizeFirst(faker.word.noun())}の${this.capitalizeFirst(faker.word.adjective())}`,
        () => `${this.capitalizeFirst(faker.word.adjective())}な${this.capitalizeFirst(faker.word.noun())}`,
        () => `${this.capitalizeFirst(faker.word.noun())}と${this.capitalizeFirst(faker.word.noun())}`
      ]
    };

    const templates = titleTemplates[this.locale as keyof typeof titleTemplates] || titleTemplates['en-US'];
    const template = faker.helpers.arrayElement(templates);
    return template();
  }

  public generateBook(index: number): Book {
    this.setSeedForIndex(index);
    
    const title = this.generateBookTitle();
    
    const numAuthors = faker.number.int({ min: 1, max: 3 });
    const authors: string[] = [];
    for (let i = 0; i < numAuthors; i++) {
      switch (this.locale) {
        case 'de-DE':
          authors.push(faker.person.fullName());
          break;
        case 'ja-JP':
          authors.push(faker.person.fullName());
          break;
        default:
          authors.push(faker.person.fullName());
      }
    }
    
    const publisherTypes = ['Press', 'Publishing', 'Books', 'Media', 'House'];
    const publisher = faker.company.name() + ' ' + faker.helpers.arrayElement(publisherTypes);
    
    const year = faker.date.between({ from: '1945-01-01', to: '2025-08-04' }).getFullYear();
    
    const likes = this.generateExactCount(this.avgLikes);
    
    const numReviews = this.generateExactCount(this.avgReviews);
    
    const reviews: Review[] = [];
    for (let i = 0; i < numReviews; i++) {
      const sentiment = this.determineReviewSentiment(likes);
      const rating = this.generateRatingFromSentiment(sentiment);
      const reviewText = this.generateReviewText(sentiment);
      
      reviews.push({
        reviewer: faker.internet.username(),
        rating: rating,
        text: reviewText,
        date: faker.date.between({ from: '2020-01-01', to: '2024-12-31' }).toLocaleDateString(this.locale)
      });
    }
    
    return {
      index,
      isbn: this.generateISBN(),
      title,
      authors,
      publisher,
      year,
      likes,
      reviews,
      coverImage: this.generateCoverImage(title, authors[0], index)
    };
  }

  private generateExactCount(targetValue: number): number {
    if (targetValue === 0) return 0;
    
    const integerPart = Math.floor(targetValue);
    const fractionalPart = targetValue - integerPart;
    
    let result = integerPart;
    
    if (fractionalPart > 0) {
      const random = faker.number.float({ min: 0, max: 1 });
      if (random < fractionalPart) {
        result += 1;
      }
    }
    
    return result;
  }

  private generateCoverImage(title: string, author: string, index: number): CoverImage {
    const width = 400;
    const height = 600;
    
    const imageId = (this.baseSeed + this.hashParameters() + index) % 1000;
    
    const imageUrl = `https://picsum.photos/seed/${imageId}/${width}/${height}`;
    
    return {
      imageUrl,
      title: title.length > 25 ? title.substring(0, 25) + '...' : title,
      author: author.length > 20 ? author.substring(0, 20) + '...' : author
    };
  }
}

app.post('/api/books', (req, res) => {
  try {
    const { error, value } = bookRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const { page, locale, seed, avgLikes, avgReviews }: BookRequest = value;
    
    const generator = new BookDataGenerator(locale, seed, avgLikes, avgReviews);
    const books: Book[] = [];
    
    const count = page === 0 ? 20 : 10;
    const startIndex = page === 0 ? 1 : 20 + (page - 1) * 10 + 1;
    
    for (let i = 0; i < count; i++) {
      books.push(generator.generateBook(startIndex + i));
    }
    
    res.json({
      books,
      page,
      hasMore: page < 50,
      metadata: {
        locale,
        seed,
        avgLikes,
        avgReviews,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;