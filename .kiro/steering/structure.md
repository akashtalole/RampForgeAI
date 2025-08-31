# Project Structure

## Root Level Organization
```
RampForgeAI/
├── .kiro/                 # Kiro IDE configuration and steering rules
├── frontend/              # Next.js React application
├── backend/               # FastAPI Python application
├── docker-compose.yml     # Multi-service development environment
├── package.json          # Root package with convenience scripts
├── README.md             # Project documentation
├── test-connectivity.js  # Service connectivity verification
└── test-setup.sh         # Development environment validation
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   └── components/       # Reusable React components
├── public/               # Static assets
├── Dockerfile           # Frontend container configuration
├── package.json         # Frontend dependencies and scripts
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration with design system
├── tsconfig.json        # TypeScript configuration with path aliases
└── eslint.config.mjs    # ESLint configuration
```

## Backend Structure (`backend/`)
```
backend/
├── app/
│   ├── api/             # API route handlers and endpoints
│   ├── models/          # SQLAlchemy database models
│   ├── services/        # Business logic and service layer
│   ├── config.py        # Application configuration
│   └── main.py          # FastAPI application entry point
├── .env.example         # Environment variables template
├── requirements.txt     # Python dependencies
└── Dockerfile          # Backend container configuration
```

## Naming Conventions

### Files and Directories
- **Frontend**: PascalCase for React components (`HealthCheck.tsx`)
- **Backend**: snake_case for Python modules (`main.py`, `config.py`)
- **Configuration**: kebab-case for config files (`docker-compose.yml`)

### Code Conventions
- **React Components**: PascalCase with descriptive names
- **API Endpoints**: RESTful patterns (`/api/v1/resource`)
- **Environment Variables**: UPPER_SNAKE_CASE
- **Database Models**: PascalCase classes, snake_case fields

## Import Patterns
- **Frontend**: Use `@/` path alias for src imports
- **Backend**: Relative imports within app structure
- **External Dependencies**: Import from package names directly

## Configuration Files Location
- **Frontend Config**: Root of frontend directory
- **Backend Config**: Root of backend directory  
- **Docker Config**: Root of project
- **IDE Config**: `.kiro/` directory for Kiro-specific settings

## Development Workflow
1. Use Docker Compose for full-stack development
2. Individual service development supported via npm/python scripts
3. Health check endpoints available for service verification
4. Hot reload enabled for both frontend and backend during development