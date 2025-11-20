# Servio - AI Business Assistant

## 🎯 Status: Fase 1 ✅ VOLTOOID

Fase 1 is volledig afgerond met alle security, authenticatie, AI integratie en theme features werkend.

## 🔑 OpenAI API Key Setup (Development)

Open browser console (F12) en voer uit:
```javascript
localStorage.setItem('OPENAI_API_KEY', 'sk-your-key-here')
```

Haal API key op: https://platform.openai.com/api-keys

## ✅ Fase 1 Voltooide Features

- **Authenticatie**: Login, signup, password reset met rate limiting
- **AI Integration**: OpenAI primary, fallback naar Mock, 3 reply varianten
- **Security**: Rate limiting (login/signup/AI), input sanitization, XSS preventie
- **Settings**: Database persistence, werkende Save button
- **Theme**: Dark/light mode consistent over alle components, HSL semantic tokens
- **User Roles**: Automatische owner role bij signup met fallback

## 🛡️ Security Features

- Rate limiting: Login (10/5min), Signup (5/5min), AI (50/min)
- Input validation met Zod
- XSS preventie met DOMPurify
- Supabase RLS policies
- Geen API keys in frontend

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 📋 Fase 2: Feature Expansion (Volgende)

- Administration Module (facturen, uitgaven, BTW)
- Document Processing (PDF analyse, contract review)
- Email Integraties (Gmail, Outlook, Zendesk)
- Multi-user & team management
