# Technology Stack

## Frontend
- **Framework**: Next.js 15.5.0 with React 19.1.0
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with custom design system
- **Build Tool**: Turbopack (Next.js built-in)
- **Linting**: ESLint with Next.js configuration

## Backend
- **Framework**: FastAPI 0.115.0
- **Language**: Python 3.11+
- **ASGI Server**: Uvicorn with standard extras
- **Database**: SQLAlchemy 2.0.36 with SQLite/aiosqlite
- **Caching**: Redis 7
- **Authentication**: python-jose with cryptography, passlib with bcrypt
- **Testing**: pytest with asyncio support

## Infrastructure
- **Containerization**: Docker with multi-service docker-compose setup
- **Development**: Hot reload enabled for both frontend and backend
- **Database**: SQLite for development, Redis for caching

## Design System
- **Colors**: Primary (#6750A4 deep purple), Accent (#50A482 teal), Light (#F2EFF7 lavender)
- **Typography**: Space Grotesk (headlines), Inter (body), Source Code Pro (code)
- **Path Aliases**: `@/*` maps to `./src/*` in frontend

## Common Commands

### Development (Recommended)
```bash
# Start all services with Docker
docker-compose up --build

# Access points:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

### Manual Development
```bash
# Install all dependencies
npm run install:all

# Frontend only
cd frontend && npm run dev

# Backend only (requires Python venv setup)
cd backend && python app/main.py
```

### Testing & Verification
```bash
# Test connectivity between services
npm run test:connectivity

# Run setup verification
chmod +x test-setup.sh && ./test-setup.sh
```

## Code Quality Standards
- TypeScript strict mode enforced
- ESLint configuration for consistent code style
- Async/await patterns preferred over callbacks
- Proper error handling and type safety required