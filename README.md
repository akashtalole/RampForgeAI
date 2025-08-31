# RampForgeAI

AI-powered developer onboarding platform that transforms weeks of traditional onboarding into hours of focused learning.

## Project Structure

```
RampForgeAI/
├── frontend/          # NextJS frontend application
├── backend/           # FastAPI backend application
├── docker-compose.yml # Docker development environment
└── README.md         # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.11+
- Docker and Docker Compose (recommended)

### Development with Docker (Recommended)

1. Clone the repository
2. Start all services:
   ```bash
   docker-compose up --build
   ```

3. Access the applications:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

### Manual Development Setup

#### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment file:
   ```bash
   cp .env.example .env
   ```

5. Start the backend:
   ```bash
   cd app
   python main.py
   ```

#### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Features Implemented

### Task 1: Project Structure and Core Configuration ✅

- ✅ NextJS project with TypeScript and Tailwind CSS
- ✅ FastAPI backend with proper project structure
- ✅ Docker development environment
- ✅ Health check endpoints
- ✅ Frontend-backend connectivity verification

### Design System

- **Colors**: Deep purple (#6750A4), Light lavender (#F2EFF7), Teal (#50A482)
- **Typography**: Space Grotesk (headlines), Inter (body), Source Code Pro (code)
- **Framework**: Tailwind CSS with custom configuration

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `GET /api/v1/status` - Detailed API status
- `GET /api/docs` - Interactive API documentation

## Environment Variables

See `backend/.env.example` for all available configuration options.

## Next Steps

The project is ready for implementing the next tasks:
- Authentication and user management system
- Core UI layout and navigation components
- MCP client infrastructure
- AI integration services

## Testing

Run the setup test script to verify all components are working:

```bash
chmod +x test-setup.sh
./test-setup.sh
```