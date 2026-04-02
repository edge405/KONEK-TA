# KONEK TA Frontend

A modern React frontend for the KONEK TA social media platform.

## Features

- **Modern UI**: Built with React 19 and TailwindCSS 4
- **Responsive Design**: Mobile-first approach with dark mode support
- **Authentication**: Secure login/register with JWT tokens
- **Real-time Features**: Live messaging and notifications
- **Interest Groups**: Join and create interest-based communities
- **Content Sharing**: Create posts with images, videos, and links

## Tech Stack

- **React 19.1.0** - UI framework
- **Vite 7.0.0** - Build tool and dev server
- **TailwindCSS 4.1.11** - Styling
- **React Router 6.28.0** - Client-side routing
- **Axios 1.7.9** - HTTP client
- **React Query 3.39.3** - Data fetching and caching
- **React Hook Form 7.54.2** - Form handling
- **React Hot Toast 2.4.1** - Notifications
- **Lucide React 0.468.0** - Icons

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Header.jsx     # Top navigation bar
│   ├── Sidebar.jsx    # Left navigation sidebar
│   ├── PostCard.jsx   # Individual post display
│   └── CreatePost.jsx # Post creation form
├── pages/             # Page components
│   ├── Home.jsx       # Main feed page
│   ├── Login.jsx      # Authentication pages
│   ├── Register.jsx
│   ├── Groups.jsx     # Interest groups
│   ├── Messages.jsx   # Messaging system
│   ├── Notifications.jsx # User notifications
│   ├── Profile.jsx    # User profile
│   └── Settings.jsx   # User settings
├── context/           # React Context providers
│   ├── AuthContext.jsx    # Authentication state
│   └── ThemeContext.jsx  # Theme management
├── services/          # API service layer
│   ├── api.js         # Axios configuration
│   ├── auth.js        # Authentication API
│   ├── posts.js       # Posts API
│   ├── groups.js      # Groups API
│   ├── messaging.js   # Messaging API
│   └── notifications.js # Notifications API
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── assets/           # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features

### Authentication
- Secure JWT-based authentication
- Protected routes with automatic redirects
- Persistent login state
- User registration and login forms

### Social Features
- **Feed**: Personalized content feed
- **Posts**: Create and share content with images/videos
- **Groups**: Join interest-based communities
- **Messaging**: Private and group conversations
- **Notifications**: Real-time activity updates

### UI/UX
- **Responsive**: Works on all device sizes
- **Dark Mode**: Toggle between light and dark themes
- **Modern Design**: Clean, minimalist interface
- **Accessibility**: WCAG compliant components

## API Integration

The frontend communicates with the Django backend through RESTful APIs:

- **Authentication**: `/api/auth/`
- **Posts**: `/api/posts/`
- **Groups**: `/api/groups/`
- **Messaging**: `/api/messaging/`
- **Notifications**: `/api/notifications/`

## State Management

- **React Context**: Global state for auth and theme
- **React Query**: Server state management and caching
- **Local State**: Component-level state with hooks

## Styling

- **TailwindCSS**: Utility-first CSS framework
- **Custom Components**: Reusable styled components
- **Dark Mode**: CSS variables for theme switching
- **Responsive**: Mobile-first design approach

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for better type safety
- Implement proper error handling

### Component Structure
- Keep components small and focused
- Use proper prop validation
- Implement loading and error states
- Follow naming conventions

### API Integration
- Use service layer for API calls
- Implement proper error handling
- Use React Query for caching
- Handle loading states

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details