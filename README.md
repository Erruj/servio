# Servio - AI Customer Service Assistant

Servio is an AI-powered customer service assistant that can automatically handle up to 80% of your emails.

## 🚀 Features

- **AI-Powered Email Analysis**: Automatically categorizes, prioritizes, and analyzes incoming emails
- **Multi-Language Support**: Dutch, English, German, French, and Spanish
- **Smart Reply Generation**: Three different response styles (Business, Empathetic, Formal)
- **Dark/Light Mode**: Persistent theme switching with system preference detection
- **Robust Error Handling**: Comprehensive fallbacks and retry mechanisms
- **Debug Tools**: Development-only debug drawer for monitoring AI operations

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Routing**: React Router DOM
- **Internationalization**: react-i18next
- **Theme Management**: next-themes
- **Security**: Input sanitization, rate limiting, validation

## 🔧 Development

### Environment Variables

The application uses mock AI responses by default. For production deployment with real AI:

```bash
# AI Configuration (production only)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50
```

### Known Limitations (Demo Mode)

- **Mock AI Responses**: All AI operations use deterministic mock responses
- **No Real Email Integration**: Email data is simulated with dummy data
- **In-Memory Storage**: All data is stored in memory and resets on refresh
- **Rate Limiting**: Simple in-memory rate limiting (resets on server restart)

### Forcing Mock Mode

For testing error scenarios, you can force specific behaviors:

```javascript
// In browser console, force timeout errors
window.FORCE_AI_TIMEOUT = true;

// Force rate limit errors
window.FORCE_RATE_LIMIT = true;

// Reset to normal
delete window.FORCE_AI_TIMEOUT;
delete window.FORCE_RATE_LIMIT;
```

### Debug Tools

In development mode, a red "Debug" button appears in the bottom-left corner. This provides:

- Real-time AI operation logs
- Performance metrics (response times)
- Error tracking and diagnostics
- Request/response payload information

## 🧪 Testing Script

Follow this manual QA script to verify all functionality:

### 1. Basic Flow
1. Start at Pricing → Click "Start gratis trial"
2. Complete Signup form → Redirected to Onboarding
3. Click "Laad demo-data" → Inbox loads with 5 sample emails
4. Select different emails → Verify AI analysis appears

### 2. AI Generation Testing
1. Select a complaint email → Click "Generate AI Response"
2. Verify 3 different suggestions appear (Business, Empathetic, Formal)
3. Switch between suggestion types → Verify content changes
4. Click "Regenerate" → Verify new variations appear
5. Force an error (disconnect internet) → Verify error handling and demo fallback

### 3. Language & Theme
1. Change language to English/German → Verify UI translations
2. Generate AI response → Verify response language matches
3. Toggle Dark/Light mode → Verify theme persists after page refresh
4. Test on all major pages → Verify no contrast issues

### 4. Navigation & Persistence
1. Navigate to all pages → Verify no dead buttons
2. Hard refresh on each page → Verify app remains functional
3. Check localStorage → Verify theme and language preferences saved

### 5. Templates & Analytics
1. Go to Templates → Create new template
2. Return to Inbox → Verify template available in AI suggestions
3. Go to Dashboard → Click "Bekijk details" → Verify Analytics page loads

## 🔒 Security Features

- **Input Sanitization**: All user inputs are sanitized using DOMPurify
- **Rate Limiting**: Prevents abuse with configurable limits
- **Schema Validation**: Zod validation for all API inputs
- **Error Boundary**: Global error catching with graceful fallbacks
- **XSS Protection**: Safe HTML rendering for email content

## 📊 Performance Optimizations

- **Debounced Search**: 300ms debounce on search inputs
- **Virtual Lists**: Handles 200+ emails efficiently
- **AI Response Caching**: LRU cache for recent AI suggestions
- **Lazy Loading**: Components and images load on demand
- **Optimistic Updates**: Immediate UI feedback for user actions

## 🌐 Internationalization

The app supports:
- Dutch (NL) - Default
- English (EN)
- German (DE)
- French (FR)
- Spanish (ES)

Language affects both UI elements and AI response generation.

## 🚀 Deployment Notes

For production deployment:

1. **Environment Setup**: Configure real AI API keys in Supabase Edge Function Secrets
2. **Error Monitoring**: Consider integrating with Sentry or similar service
3. **Analytics**: The analytics endpoints need real data sources
4. **Email Integration**: Replace mock email data with real email API integration
5. **Database**: Replace in-memory storage with persistent database

## 🔍 Troubleshooting

### Common Issues

**AI Generation Fails**
- Check console logs in Debug Drawer
- Verify rate limiting isn't triggered
- Ensure input validation passes

**Theme Not Persisting**
- Check localStorage for theme preference
- Verify next-themes provider is correctly configured

**Language Not Switching**
- Check i18next configuration
- Verify translation files are complete

**Performance Issues**
- Monitor AI response times in Debug Drawer
- Check for memory leaks in long-running sessions
- Consider reducing cache size for low-memory devices

For additional support, check the Debug Drawer logs for detailed error information.

## Development Setup

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd servio

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── EnhancedReplyEditor.tsx  # AI-powered reply editor
│   ├── DebugDrawer.tsx          # Development debugging tools
│   └── ...
├── pages/              # Route components
├── lib/                # Utilities and configurations
│   ├── ai.ts           # AI/Mock generation logic
│   ├── security.ts     # Security utilities
│   └── i18n.ts         # Internationalization
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```