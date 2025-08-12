# Doggo_Gorb NFT Website

A modern, responsive NFT website for the Doggo_Gorb project featuring an exclusive collection with stunning animations and interactive elements.

## 🚀 Features

### Design & UI
- **Modern Design**: Clean, professional design with garbage dump aesthetic
- **Responsive Layout**: Fully responsive design that works on all devices
- **Smooth Animations**: CSS animations and JavaScript interactions
- **Glass Morphism**: Modern glassmorphism effects with backdrop blur
- **Particle Effects**: Dynamic particle animations in the hero section

### Sections
1. **Home**: Hero section with banner image, project title, and marketplace buttons
2. **Info**: Collection details including supply, mint prices, and PFP collection info
3. **Utility**: Staking and revenue sharing information
4. **Roadmap**: 4-phase development timeline
5. **Community**: Social media links (X/Twitter and Discord)

### Interactive Features
- **Mobile Menu**: Hamburger menu for mobile devices
- **Smooth Scrolling**: Navigation with smooth scroll behavior
- **Scroll Progress**: Visual progress indicator
- **Parallax Effects**: Background parallax on scroll
- **Hover Animations**: Interactive hover effects on cards and buttons
- **Ripple Effects**: Button click animations
- **Typing Animation**: Hero title typing effect
- **Counter Animation**: Animated supply counter

## 📁 Project Structure

```
website/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript functionality
├── vercel.json         # Vercel deployment configuration
├── package.json        # Project dependencies
├── images/
│   ├── background.png  # Hero background image
│   ├── banner.png      # Banner image
│   ├── NFT.png         # Exclusive collection image
│   └── pfp collection.png # PFP collection image
└── README.md           # Project documentation
```

## 🎨 Design Elements

### Color Scheme
- **Primary**: #ff6b35 (Orange/Rust)
- **Secondary**: #f7931e (Golden Orange)
- **Background**: #1a1a1a (Dark)
- **Text**: #ffffff (White)
- **Accent**: #cccccc (Light Gray)

### Typography
- **Font Family**: JulyGo (CDN Fonts)
- **Fallback**: Inter (Google Fonts)

## 🛠️ Setup Instructions

### Local Development
1. **Clone or Download** the project files
2. **Install Dependencies**: `npm install`
3. **Start Development Server**: `npm run dev`
4. **Open** http://localhost:3000 in a web browser

### Customization
- Update project information in the HTML
- Modify colors in `styles.css`
- Add your social media links
- Replace the images in the `images/` folder

## 🚀 Deployment

### Frontend (Vercel)
1. **Push to GitHub**: Upload your code to a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the static site
3. **Deploy**: Click deploy and your site will be live
4. **Custom Domain**: Add your custom domain in Vercel settings

### Backend (Render)
1. **Create Backend Service**: Set up your backend API on Render
2. **Environment Variables**: Configure your backend URL in Vercel
3. **API Integration**: Update frontend to connect to your Render backend

### Environment Variables (Vercel)
```bash
# Add these in Vercel dashboard
BACKEND_URL=https://your-backend.onrender.com
API_KEY=your_api_key_here
```

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## 🔧 Customization

### Updating Content
- Edit the HTML file to change text content
- Update social media links in the community section
- Modify the roadmap phases as needed

### Styling Changes
- Colors can be modified in the CSS variables
- Animations can be adjusted in the CSS keyframes
- Layout changes can be made in the grid and flexbox properties

### Adding Features
- New sections can be added following the existing structure
- Additional animations can be implemented in JavaScript
- More interactive elements can be added using the existing patterns

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

## 📞 Contact

For questions or support, please reach out through the community links on the website.

---

**Note**: This website is designed for the Doggo_Gorb NFT project. Make sure to update all placeholder content and links before deploying to production.
