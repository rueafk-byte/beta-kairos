# 🎮 Kaboom Production Server Setup

This guide will help you set up the production server for the Kaboom game with real player data management and admin controls.

## 🚀 Quick Start

### Prerequisites
- **Node.js 14+** installed on your system
- **Git** (optional, for version control)

### Installation

1. **Clone or download** the project files to your server
2. **Open terminal** in the project directory
3. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

The setup script will:
- ✅ Check Node.js installation
- 📦 Install all dependencies
- 🗄️ Create the database
- 🚀 Start the production server

## 📊 What's Included

### Production Server Features
- **Real Database Storage**: SQLite database for persistent player data
- **RESTful API**: Complete API for player management
- **Admin Controls**: Full admin panel for managing players
- **Data Export**: Export player data as JSON files
- **Action Logging**: Track all admin actions
- **Health Monitoring**: Server status monitoring

### Admin Panel Features
- **Player Search**: Find any player by wallet address
- **Real-time Stats**: Live player statistics and token tracking
- **Player Management**: Reset progress, delete profiles, export data
- **Analytics Dashboard**: Token distribution, player rankings
- **Database Integration**: Direct access to production data

## 🌐 Server URLs

Once running, access these URLs:

- **🎯 Game**: `http://localhost:3000/`
- **📊 Admin Dashboard**: `http://localhost:3000/admin-dashboard.html`
- **🔍 Simple Admin Panel**: `http://localhost:3000/admin-panel.html`
- **🏥 Health Check**: `http://localhost:3000/api/health`

## 🗄️ Database Schema

### Players Table
```sql
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    level INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    boom_tokens INTEGER DEFAULT 0,
    lives INTEGER DEFAULT 3,
    current_score INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Game Sessions Table
```sql
CREATE TABLE game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME,
    score_earned INTEGER DEFAULT 0,
    tokens_earned INTEGER DEFAULT 0,
    enemies_killed INTEGER DEFAULT 0,
    levels_completed INTEGER DEFAULT 0
);
```

### Admin Actions Table
```sql
CREATE TABLE admin_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_ip TEXT,
    action_type TEXT NOT NULL,
    target_wallet TEXT,
    action_details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 API Endpoints

### Player Management
- `GET /api/players` - Get all players
- `GET /api/players/:walletAddress` - Get specific player
- `POST /api/players` - Create/update player
- `PUT /api/players/:walletAddress/progress` - Update player progress
- `DELETE /api/players/:walletAddress` - Delete player
- `POST /api/players/:walletAddress/reset` - Reset player progress

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/token-distribution` - Get token distribution
- `GET /api/search/players?q=searchTerm` - Search players
- `GET /api/admin/actions` - Get admin action log

### Data Export
- `GET /api/players/:walletAddress/export` - Export player data

## 🛠️ Manual Setup (Alternative)

If you prefer manual setup:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **For development** (auto-restart on changes):
   ```bash
   npm run dev
   ```

## 🔒 Security Considerations

### Production Deployment
- **Environment Variables**: Set `PORT` for custom port
- **HTTPS**: Use SSL certificates for production
- **Firewall**: Configure firewall rules
- **Database Backup**: Regular database backups
- **Admin Access**: Restrict admin panel access

### Example Environment Setup
```bash
export PORT=3000
export NODE_ENV=production
npm start
```

## 📈 Monitoring & Maintenance

### Health Checks
- Monitor `/api/health` endpoint
- Check database connectivity
- Monitor server logs

### Database Maintenance
- Regular backups of `player_data.db`
- Monitor database size
- Clean old session data periodically

### Log Monitoring
- Admin action logs in database
- Server error logs
- Player activity tracking

## 🚀 Deployment Options

### Local Development
```bash
npm run dev
```

### Production Server
```bash
npm start
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database locked**:
   ```bash
   rm player_data.db
   npm start
   ```

3. **Dependencies missing**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Server Logs
- Check console output for errors
- Monitor database connection status
- Verify API endpoint responses

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify database connectivity
4. Test API endpoints manually

## 🎯 Next Steps

After setup:
1. **Test the game** at `http://localhost:3000/`
2. **Access admin panel** to verify functionality
3. **Create test players** to validate data storage
4. **Configure production settings** for deployment
5. **Set up monitoring** and backup systems

---

**🎮 Happy Gaming!** Your production server is ready to handle real players worldwide!
