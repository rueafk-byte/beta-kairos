# 🎮 Pirate Bomb Enhanced Backend v2.0

An advanced, production-ready backend system for the Pirate Bomb Web3 game featuring comprehensive security, caching, analytics, and blockchain integration.

## 🚀 Key Features

### 🔒 Advanced Security
- **Helmet.js** security headers
- **Rate limiting** with customizable rules
- **Input validation** and sanitization
- **IP filtering** and DoS protection
- **Request monitoring** and threat detection
- **CORS configuration** for production

### ⚡ Performance Optimization
- **Multi-tier caching** system with TTL management
- **Response compression** with gzip
- **Database indexing** for optimized queries
- **Connection pooling** and query optimization
- **Request/response monitoring** with performance metrics

### 📊 Comprehensive Analytics
- **Player statistics** and progression tracking
- **Game session** detailed analytics
- **Token transaction** monitoring
- **Achievement system** with progress tracking
- **Leaderboards** with multiple categories
- **Admin action logging** for audit trails

### 🎯 Game-Specific Features
- **Achievement system** with unlockable rewards
- **NFT inventory** management
- **Daily challenges** and progression
- **Lives and recharge** system
- **Multi-token support** (BOOM and Admiral tokens)
- **Session management** with detailed tracking

### 🔧 Development & Operations
- **Structured logging** with Winston
- **Error handling** with custom error classes
- **Health checks** and monitoring endpoints
- **Graceful shutdown** handling
- **Environment configuration** management
- **Hot reloading** in development

## 🏗️ Architecture

```
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration and connection
│   ├── controllers/
│   │   ├── playerController.js  # Player management logic
│   │   └── gameController.js    # Game sessions and achievements
│   ├── middleware/
│   │   ├── security.js          # Security middleware and validation
│   │   └── errorHandler.js      # Error handling and custom errors
│   ├── routes/
│   │   └── api.js              # API route definitions
│   └── utils/
│       ├── logger.js           # Logging system
│       └── cache.js            # Caching management
├── logs/                       # Application logs
├── server.js                   # Main application entry point
└── .env.example               # Environment configuration template
```

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create logs directory:**
   ```bash
   mkdir -p logs
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Available Scripts
- `npm start` - Production mode
- `npm run dev` - Development with auto-restart
- `npm test` - Run tests
- `npm run lint` - Code linting
- `npm run db:migrate` - Run database migrations

## 🌐 API Endpoints

### Player Management
- `GET /api/players` - Get all players with pagination
- `GET /api/players/:walletAddress` - Get specific player
- `GET /api/players/:walletAddress/stats` - Get player statistics
- `POST /api/players` - Create or update player
- `PUT /api/players/:walletAddress/progress` - Update progress
- `DELETE /api/players/:walletAddress` - Delete player (admin)

### Game Sessions
- `POST /api/game/sessions` - Start new game session
- `PUT /api/game/sessions/:sessionId` - Update session progress
- `POST /api/game/sessions/:sessionId/end` - End session
- `GET /api/game/sessions/:walletAddress` - Get player sessions

### Achievements & Leaderboards
- `GET /api/game/achievements` - Get all achievements
- `GET /api/game/achievements/:walletAddress` - Get player achievements
- `POST /api/game/achievements/:walletAddress/:achievementId` - Unlock achievement
- `GET /api/game/leaderboards` - Get leaderboards

### System & Admin
- `GET /api/health` - Health check
- `GET /api/metrics` - System metrics (admin)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/admin/actions` - Admin action logs

## 🗄️ Database Schema

### Enhanced Tables
- **players** - Player profiles with extended fields
- **game_sessions** - Detailed session tracking
- **achievements** - Achievement definitions
- **player_achievements** - Player achievement progress
- **token_transactions** - Token transaction history
- **nft_inventory** - NFT ownership tracking
- **leaderboards** - Ranking systems
- **daily_challenges** - Challenge system
- **admin_actions** - Admin activity logs
- **system_analytics** - System metrics

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./player_data.db
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Security Configuration
- Rate limiting per endpoint type
- CORS origin restrictions
- Input validation rules
- Security header configuration

### Cache Configuration
- Player data: 5 minutes TTL
- Leaderboards: 10 minutes TTL
- Statistics: 15 minutes TTL
- Achievements: 30 minutes TTL

## 📊 Monitoring & Analytics

### Health Monitoring
- Database connectivity checks
- Cache performance metrics
- Memory usage tracking
- Request/response monitoring

### Performance Metrics
- Cache hit/miss ratios
- Database query performance
- API response times
- Error rates and patterns

### Security Monitoring
- Rate limit violations
- Suspicious request patterns
- Authentication failures
- Admin action auditing

## 🔐 Security Features

### Request Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Rate Limiting
- General API: 1000 requests/15 minutes
- Authentication: 10 attempts/15 minutes
- Game sessions: 100 actions/minute
- Admin actions: 50 actions/5 minutes

### Monitoring
- Automated threat detection
- Security event logging
- IP-based filtering
- Suspicious pattern recognition

## 🚨 Error Handling

### Custom Error Classes
- `ValidationError` - Input validation failures
- `DatabaseError` - Database operation errors
- `GameError` - Game logic errors
- `BlockchainError` - Web3 integration errors
- `RateLimitError` - Rate limiting violations

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "unique-request-id"
  }
}
```

## 📝 Logging

### Log Categories
- **Application logs** - General application events
- **Error logs** - Error tracking and debugging
- **Game logs** - Game-specific events
- **Security logs** - Security events and violations
- **API logs** - API access and performance

### Log Rotation
- Daily rotation with 14-day retention
- Error logs kept for 30 days
- Automatic compression and cleanup

## 🔄 Caching Strategy

### Multi-Tier Caching
- **Memory cache** for frequently accessed data
- **TTL-based expiration** for data freshness
- **Intelligent invalidation** for related data
- **Performance monitoring** for cache efficiency

### Cache Types
- Player data caching
- Leaderboard caching
- Game statistics caching
- API response caching
- Rate limiting data

## 🛠️ Development

### Code Structure
- **Controllers** handle business logic
- **Middleware** manages request processing
- **Services** contain reusable functionality
- **Utils** provide helper functions

### Best Practices
- Async/await error handling
- Input validation on all endpoints
- Comprehensive logging
- Performance monitoring
- Security-first approach

## 📈 Performance Benchmarks

### Optimizations
- Database queries with proper indexing
- Response compression (gzip)
- Efficient caching strategies
- Connection pooling
- Memory usage optimization

### Monitoring
- Request/response times
- Database query performance
- Cache hit ratios
- Memory and CPU usage

## 🔮 Future Enhancements

### Planned Features
- Redis integration for distributed caching
- WebSocket real-time features
- Advanced analytics dashboard
- Blockchain integration layer
- Mobile app API support
- Microservices architecture

### Scalability
- Horizontal scaling support
- Load balancer compatibility
- Database sharding preparation
- CDN integration ready

---

## 🤝 Contributing

1. Follow the existing code structure
2. Add comprehensive error handling
3. Include logging for important events
4. Write tests for new features
5. Update documentation

## 📄 License

MIT License - see LICENSE file for details.

---

**Enhanced Pirate Bomb Backend v2.0** - Built for scale, security, and performance. 🎮⚓️