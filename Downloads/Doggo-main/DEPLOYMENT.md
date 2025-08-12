# Deploy to Netlify/Render - Doggo NFT Website

## Method 1: Drag & Drop (Easiest)

1. **Go to Netlify**: Visit [netlify.com](https://netlify.com) and sign up/login
2. **Drag & Drop**: Simply drag your entire `Doggo` folder to the Netlify dashboard
3. **Wait**: Netlify will automatically deploy your site
4. **Get URL**: You'll get a random URL like `https://random-name.netlify.app`

## Method 2: Git Integration (Recommended)

1. **Push to GitHub**: 
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/doggo-website.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Deploy settings: Build command: leave empty, Publish directory: `.`

## Method 3: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy
   ```

## Method 4: Deploy to Render

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Render configuration"
   git push
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `doggo-nft-website`
     - **Build Command**: Leave empty
     - **Publish Directory**: `.` (dot)
   - Click "Create Static Site"

3. **Your site will be deployed automatically!**

## Your Files Are Ready!

Your website includes:
- ✅ `index.html` - Main page
- ✅ `script.min.js` - Obfuscated JavaScript (hidden from easy viewing)
- ✅ `script-backup.js` - Original JavaScript (for development)
- ✅ `styles.css` - Styling
- ✅ `images/` - All your images
- ✅ `netlify.toml` - Optimized deployment config for Netlify
- ✅ `render.yaml` - Optimized deployment config for Render
- ✅ `_redirects` - Routing configuration

## Features Included:
- Mobile-responsive navigation
- Smooth scrolling
- Parallax effects
- Counter animations
- Particle effects
- Touch gestures
- Progress bar
- Ripple effects on buttons

## Custom Domain (Optional)
After deployment, you can add a custom domain in Netlify settings.

## 🔒 Security Features
- **Obfuscated JavaScript**: Your code is now hidden from easy viewing
- **Minified**: File size reduced for faster loading
- **Backup preserved**: Original code saved as `script-backup.js`

## Troubleshooting
- If images don't load, check that the `images/` folder is included
- If JavaScript doesn't work, ensure `script.min.js` is in the root directory
- Check browser console for any errors
- To edit code: Use `script-backup.js`, then re-obfuscate
