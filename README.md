# OLX Marketplace - Full Stack Classified Ads Platform

A full-stack classified ads marketplace built with **MERN Stack** (MongoDB, Express.js, React + Vite, Node.js).

---

## ðŸš€ Features Implemented

### 1. User Authentication System
- JWT-based secure registration and login
- Password hashing with bcrypt
- Email verification with OTP codes
- Password reset functionality
- Google OAuth integration
- Account lockout after failed login attempts (5 attempts)
- Temporary email domain blocking

### 2. Classified Ads Marketplace
- **Post Ads**: Create listings with multiple images, pricing, categories, subcategories
- **Ad Types**: Featured ads (highlighted with gold styling) and Simple ads
- **Categories**: Hierarchical category/subcategory system
- **Cities**: Location-based listings
- **Search & Filters**: Filter by category, subcategory, price range, city
- **Favorites**: Save ads to favorites list

### 3. Dual View Tracking System
- **Featured Ads**: Impression-based tracking (every page load counts)
- **Simple Ads**: Unique view tracking (1 view per user/IP, resets after 24 hours)
- Bot detection and filtering
- Analytics ready for dashboard

### 4. User Dashboard
- View own posted ads
- Edit profile (name, phone, city, bio)
- Favorites management
- Ad renewal (auto-duration based on settings)
- Messages inbox

### 5. Admin Dashboard (`/admin`)
- **Dashboard Analytics**: Revenue trends, user stats, category breakdown
- **Ads Management**: Approve/reject ads, edit details, renew ads, delete
- **User Management**: View users, ban/unban, assign badges
- **Category Management**: Create/edit/delete categories and subcategories
- **SEO Settings**: Meta tags, keywords for dynamic pages
- **Site Settings**: Configurable ads duration, pagination, price format
- **Activity Logs**: Track admin actions and user activities
- **Reports Management**: View user-submitted reports

### 6. Auto-Sync Ads Duration
- When admin changes Simple/Featured ad duration in settings, all active ads are automatically updated
- Bulk update without manual renewal required
- Instant sync across all pages

### 7. Email System
- SMTP configuration for transactional emails
- Email templates for verification, password reset, password changed
- Customizable sender name and email

### 8. Security Features
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for HTTP security headers
- JWT token expiry configuration
- Password strength validation
- Protected routes for authenticated users

---

## ðŸ›  Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, TailwindCSS 3, React Router v6, Axios, Recharts, Heroicons |
| **Backend** | Node.js, Express.js, MongoDB Atlas, Mongoose 8 |
| **Auth** | JWT, bcryptjs, Google OAuth |
| **Email** | Nodemailer (SMTP) |

---

## ðŸ“‚ Project Structure

```
ecomapp/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ db.js              # MongoDB connection
â”‚   â”œâ”€â”€ controllers/           # Business logic
â”‚   â”‚   â”œâ”€â”€ adController.js
â”‚   â”‚   â”œâ”€â”€ adminController.js
â”‚   â”‚   â”œâ”€â”€ authController.js
â”‚   â”‚   â”œâ”€â”€ categoryController.js
â”‚   â”‚   â”œâ”€â”€ cityController.js
â”‚   â”‚   â”œâ”€â”€ favoriteController.js
â”‚   â”‚   â”œâ”€â”€ messageController.js
â”‚   â”‚   â”œâ”€â”€ reportController.js
â”‚   â”‚   â”œâ”€â”€ seoController.js
â”‚   â”‚   â”œâ”€â”€ subcategoryController.js
â”‚   â”‚   â”œâ”€â”€ userController.js
â”‚   â”‚   â””â”€â”€ viewController.js
â”‚   â”œâ”€â”€ middleware/
â”‚   â”‚   â”œâ”€â”€ authMiddleware.js  # JWT auth, admin check
â”‚   â”‚   â””â”€â”€ rateLimiter.js     # Request rate limiting
â”‚   â”œâ”€â”€ models/                # Mongoose schemas
â”‚   â”‚   â”œâ”€â”€ ActivityLog.js
â”‚   â”‚   â”œâ”€â”€ Ad.js
â”‚   â”‚   â”œâ”€â”€ Category.js
â”‚   â”‚   â”œâ”€â”€ City.js
â”‚   â”‚   â”œâ”€â”€ Favorite.js
â”‚   â”‚   â”œâ”€â”€ FeaturedAdView.js
â”‚   â”‚   â”œâ”€â”€ Message.js
â”‚   â”‚   â”œâ”€â”€ Report.js
â”‚   â”‚   â”œâ”€â”€ SeoContent.js
â”‚   â”‚   â”œâ”€â”€ Settings.js
â”‚   â”‚   â”œâ”€â”€ SimpleAdView.js
â”‚   â”‚   â”œâ”€â”€ Subcategory.js
â”‚   â”‚   â”œâ”€â”€ User.js
â”‚   â”‚   â””â”€â”€ index.js
â”‚   â”œâ”€â”€ routes/                 # API routes
â”‚   â”‚   â”œâ”€â”€ adRoutes.js
â”‚   â”‚   â”œâ”€â”€ adminRoutes.js
â”‚   â”‚   â”œâ”€â”€ categoryRoutes.js
â”‚   â”‚   â”œâ”€â”€ cityRoutes.js
â”‚   â”‚   â”œâ”€â”€ favoriteRoutes.js
â”‚   â”‚   â”œâ”€â”€ messageRoutes.js
â”‚   â”‚   â”œâ”€â”€ reportRoutes.js
â”‚   â”‚   â”œâ”€â”€ seoContentRoutes.js
â”‚   â”‚   â”œâ”€â”€ settingsRoutes.js
â”‚   â”‚   â”œâ”€â”€ subcategoryRoutes.js
â”‚   â”‚   â”œâ”€â”€ uploadRoutes.js
â”‚   â”‚   â”œâ”€â”€ userRoutes.js
â”‚   â”‚   â”œâ”€â”€ viewRoutes.js
â”‚   â”‚   â””â”€â”€ index.js
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â”œâ”€â”€ activityLogger.js
â”‚   â”‚   â”œâ”€â”€ emailSender.js
â”‚   â”‚   â””â”€â”€ validators.js
â”‚   â””â”€â”€ server.js
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ public/
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ components/         # Reusable components
â”‚       â”‚   â”œâ”€â”€ AdCard.jsx
â”‚       â”‚   â”œâ”€â”€ AdGrid.jsx
â”‚       â”‚   â”œâ”€â”€ CitySelector.jsx
â”‚       â”‚   â”œâ”€â”€ ImageCarousel.jsx
â”‚       â”‚   â”œâ”€â”€ Layout.jsx
â”‚       â”‚   â”œâ”€â”€ Navbar.jsx
â”‚       â”‚   â”œâ”€â”€ ProtectedRoute.jsx
â”‚       â”‚   â”œâ”€â”€ Rating.jsx
â”‚       â”‚   â””â”€â”€ index.js
â”‚       â”œâ”€â”€ context/             # React contexts
â”‚       â”‚   â”œâ”€â”€ AdContext.jsx
â”‚       â”‚   â”œâ”€â”€ AuthContext.jsx
â”‚       â”‚   â”œâ”€â”€ CartContext.jsx
â”‚       â”‚   â””â”€â”€ SettingsContext.jsx
â”‚       â”œâ”€â”€ hooks/              # Custom hooks
â”‚       â”‚   â””â”€â”€ useViewTracker.js
â”‚       â”œâ”€â”€ pages/              # Page components
â”‚       â”‚   â”œâ”€â”€ AdDetailPage.jsx
â”‚       â”‚   â”œâ”€â”€ AdsListingPage.jsx
â”‚       â”‚   â”œâ”€â”€ AdminAdsPage.jsx
â”‚       â”‚   â”œâ”€â”€ AdminDashboardPage.jsx
â”‚       â”‚   â”œâ”€â”€ AdminReportsPage.jsx
â”‚       â”‚   â”œâ”€â”€ AdminSettingsPage.jsx
â”‚       â”‚   â”œâ”€â”€ AdminUsersPage.jsx
â”‚       â”‚   â”œâ”€â”€ CategoryManagePage.jsx
â”‚       â”‚   â”œâ”€â”€ ForgotPasswordPage.jsx
â”‚       â”‚   â”œâ”€â”€ HomePage.jsx
â”‚       â”‚   â”œâ”€â”€ LoginPage.jsx
â”‚       â”‚   â”œâ”€â”€ MessagesPage.jsx
â”‚       â”‚   â”œâ”€â”€ PostAdPage.jsx
â”‚       â”‚   â”œâ”€â”€ ProfilePage.jsx
â”‚       â”‚   â”œâ”€â”€ RegisterPage.jsx
â”‚       â”‚   â”œâ”€â”€ ResetPasswordPage.jsx
â”‚       â”‚   â”œâ”€â”€ UserDashboardPage.jsx
â”‚       â”‚   â””â”€â”€ UserProfile.jsx
â”‚       â”œâ”€â”€ utils/
â”‚       â”‚   â””â”€â”€ urlUtils.js
â”‚       â”œâ”€â”€ App.jsx
â”‚       â””â”€â”€ main.jsx
â”œâ”€â”€ uploads/                   # Uploaded files
â”œâ”€â”€ .env.example
â”œâ”€â”€ package.json
â””â”€â”€ README.md
```

---

## ðŸŒ API Endpoints

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ads` | Get all ads with filters |
| GET | `/api/ads/featured` | Get featured ads |
| GET | `/api/ads/latest` | Get latest ads |
| GET | `/api/ads/:id` | Get single ad details |
| GET | `/api/categories` | Get all categories |
| GET | `/api/subcategories` | Get all subcategories |
| GET | `/api/cities` | Get all cities |
| GET | `/api/settings` | Get site settings |
| POST | `/api/views/track` | Track single ad view |
| POST | `/api/views/track-bulk` | Track multiple ad views |

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | User registration |
| POST | `/api/users/login` | User login |
| POST | `/api/users/google` | Google OAuth login |
| POST | `/api/users/verify-email` | Verify email OTP |
| POST | `/api/users/forgot-password` | Request password reset |
| POST | `/api/users/reset-password` | Reset password |
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |

### Protected Routes (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ads` | Create new ad |
| PUT | `/api/ads/:id` | Update ad |
| DELETE | `/api/ads/:id` | Delete ad |
| GET | `/api/ads/my` | Get user's ads |
| GET | `/api/favorites` | Get user favorites |
| POST | `/api/favorites/:adId` | Toggle favorite |
| GET | `/api/messages` | Get conversations |
| POST | `/api/messages` | Send message |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Dashboard analytics |
| PUT | `/settings` | Update site settings |
| POST | `/update-ads-duration` | Auto-sync ads duration |
| GET | `/users` | Get all users |
| PUT | `/users/:id/status` | Ban/unban user |
| PUT | `/users/:id/badges` | Manage user badges |
| GET | `/ads` | Get all ads (admin view) |
| PUT | `/ads/:id` | Update any ad |
| DELETE | `/ads/:id` | Delete any ad |
| GET | `/reports` | Get user reports |
| PUT | `/reports/:id` | Handle report |
| GET | `/activity-logs` | Get activity logs |

---

## âš™ï¸ Site Settings (Admin Configurable)

| Setting | Default | Description |
|---------|---------|-------------|
| `siteName` | MarketX | Site display name |
| `featuredAdsLimit` | 10 | Featured ads on homepage |
| `latestAdsLimit` | 10 | Latest ads on homepage |
| `simpleAdsDuration` | 30 days | Simple ad expiration |
| `featuredAdsDuration` | 7 days | Featured ad expiration |
| `maxImagesPerAd` | 5 | Max images per ad |
| `priceFormat` | PKR | Currency symbol |
| `featuredAdsPerPage` | 12 | Ads per page |
| `rotationLogic` | random | Featured ads rotation |
| `enableEmailVerification` | true | Require email verification |

---

## ðŸš€ Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone the project
```bash
git clone <your-repo>
cd ecomapp
```

### 2. Backend Setup
Create `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ecomm
JWT_SECRET=your_super_secret_key_at_least_32_chars
JWT_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Run backend:
```bash
cd backend
npm install
npm run dev
# â†’ API runs on http://localhost:5000
```

### 3. Frontend Setup
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Run frontend:
```bash
cd frontend
npm install
npm run dev
# â†’ App runs on http://localhost:5173
```

---

## ðŸ” Security Notes

- Never commit `.env` files
- Use strong JWT secrets (32+ characters)
- Enable MongoDB Atlas IP whitelist
- Use app passwords for Gmail SMTP
- Keep dependencies updated

---

## ðŸ“ License

MIT License - Feel free to use for personal or commercial projects.
"# elocanto" 






