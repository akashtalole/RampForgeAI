# Frontend Documentation

## Overview

The RampForgeAI frontend is built with Next.js 15.5.0, React 19.1.0, and TypeScript, providing a modern, responsive interface for the AI-powered developer onboarding platform.

## Architecture

### Technology Stack
- **Framework**: Next.js 15.5.0 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Custom component library with shadcn/ui patterns
- **State Management**: React hooks and context
- **Authentication**: JWT-based with protected routes

### Design System
- **Colors**: 
  - Primary: #6750A4 (deep purple)
  - Accent: #50A482 (teal) 
  - Light: #F2EFF7 (lavender)
- **Typography**:
  - Headlines: Space Grotesk
  - Body: Inter
  - Code: Source Code Pro

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── project-management/ # Project management interface
│   │   ├── settings/           # Application settings
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Reusable components
│   │   ├── auth/              # Authentication components
│   │   ├── layout/            # Layout components
│   │   ├── mcp/               # MCP service management
│   │   ├── project-management/ # PM-specific components
│   │   └── ui/                # Base UI components
│   └── lib/                   # Utilities and helpers
├── public/                    # Static assets
└── config files              # Next.js, TypeScript, Tailwind configs
```

## Key Features

### Authentication System
- JWT-based authentication with secure token storage
- Protected route wrapper component
- Automatic token refresh and session management
- Role-based access control

### Layout System
- Consistent main layout with sidebar navigation
- Responsive design for mobile and desktop
- Theme toggle support (light/dark mode)
- Breadcrumb navigation

### MCP Integration Interface
- Service configuration forms for GitHub, GitLab, Jira, Azure DevOps
- Real-time connection status monitoring
- Credential management with secure storage
- Health check and sync capabilities

### Project Management Dashboard
- Unified view of project management tools
- Real-time data synchronization status
- Workflow analysis and team insights
- Interactive project overview with drill-down capabilities

## Component Architecture

### Page Components
All page components follow a consistent pattern:
1. Wrapped in `ProtectedRoute` for authentication
2. Use `MainLayout` for consistent UI structure
3. Implement proper TypeScript interfaces
4. Handle loading and error states

Example structure:
```typescript
function PageContent() {
  // Component logic
  return (
    <MainLayout>
      {/* Page content */}
    </MainLayout>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <PageContent />
    </ProtectedRoute>
  );
}
```

### UI Components
- Built with Tailwind CSS and custom design tokens
- Consistent prop interfaces and TypeScript support
- Accessible by default with ARIA attributes
- Support for light/dark theme variants

## Development Guidelines

### Code Standards
- TypeScript strict mode enforced
- ESLint configuration for consistent style
- Async/await patterns preferred
- Proper error handling and type safety

### Component Guidelines
- Use functional components with hooks
- Implement proper prop validation with TypeScript
- Follow naming conventions (PascalCase for components)
- Include JSDoc comments for complex components

### State Management
- Use React hooks for local state
- Context API for global state (auth, theme)
- Avoid prop drilling with proper component composition
- Implement proper cleanup in useEffect hooks

## API Integration

### Backend Communication
- RESTful API calls to FastAPI backend
- Automatic JWT token inclusion in requests
- Proper error handling and user feedback
- Loading states for better UX

### MCP Service Integration
- Dynamic service configuration
- Real-time status updates
- Credential validation and testing
- Batch operations for multiple services

## Testing Strategy

### Component Testing
- React Testing Library for component tests
- Jest for unit testing
- Mock API responses for integration tests
- Accessibility testing with jest-axe

### End-to-End Testing
- Playwright for full user workflows
- Authentication flow testing
- Cross-browser compatibility
- Performance testing

## Deployment

### Build Process
- Next.js optimized production builds
- Static asset optimization
- Code splitting and lazy loading
- Environment-specific configurations

### Docker Configuration
- Multi-stage build for production
- Optimized image size
- Health check endpoints
- Environment variable injection