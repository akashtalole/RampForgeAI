# Frontend Pages Documentation

## Page Architecture

All pages in RampForgeAI follow a consistent architecture pattern using Next.js App Router with TypeScript and the established component structure.

## Page Structure Pattern

### Standard Page Template
```typescript
'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

function PageContent() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Page content */}
      </div>
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

## Core Pages

### Dashboard Page
**Location**: `src/app/dashboard/page.tsx`

**Purpose**: Main landing page after authentication showing project overview and quick actions.

**Features**:
- Project status cards
- Recent activity feed
- Quick action buttons
- Analytics overview
- Navigation to other sections

**Components Used**:
- `MainLayout` for consistent structure
- `ProtectedRoute` for authentication
- Custom dashboard cards
- Activity timeline components

### Analysis Page
**Location**: `src/app/analysis/page.tsx`

**Purpose**: Comprehensive codebase analysis interface for understanding architecture, complexity, and feature mapping.

**Features**:
- **Repository Selection**: Grid-based repository selection with status indicators
- **Analysis Triggering**: On-demand analysis execution with progress tracking
- **Multi-Tab Results**: Organized analysis results across four main sections
- **Interactive Metrics**: Visual complexity scoring and progress indicators
- **Mock Data Fallback**: Graceful degradation when API is unavailable

**Key Components Used**:
- `Tabs` component with four main sections (Overview, Architecture, Features, Recommendations)
- `Progress` bars for complexity scoring and confidence metrics
- `Badge` components for repository types, priorities, and file references
- Lucide React icons for visual enhancement
- `Card` layouts for organized information display

**Analysis Sections**:
1. **Overview Tab**: 
   - Complexity score with color-coded indicators
   - Feature count and architecture component metrics
   - Design pattern identification with confidence scores
   - Visual progress bars and metric cards

2. **Architecture Tab**:
   - Component breakdown with complexity scoring
   - Dependency mapping and file counts
   - Technology stack identification
   - Component relationship visualization

3. **Features Tab**:
   - Feature identification with descriptions
   - File mapping and complexity analysis
   - Test coverage metrics with color coding
   - Implementation detail breakdown

4. **Recommendations Tab**:
   - AI-powered improvement suggestions
   - Priority-based recommendation sorting
   - Affected file identification
   - Actionable improvement guidance

**State Management**:
```typescript
const [repositories, setRepositories] = useState<Repository[]>([]);
const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
const [loading, setLoading] = useState(false);
const [analyzing, setAnalyzing] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**API Integration**:
- Repository fetching from `/api/v1/repositories`
- Analysis results from `/api/v1/repositories/{id}/analysis`
- Analysis triggering via POST to `/api/v1/repositories/{id}/analyze`
- Polling mechanism for long-running analysis tasks
- Comprehensive error handling with fallback to mock data

### Settings Page
**Location**: `src/app/settings/page.tsx`

**Purpose**: Application configuration and user preferences management.

**Features**:
- **General Tab**: Theme settings, appearance preferences
- **Integrations Tab**: MCP service management with `MCPServiceList`
- **Account Tab**: User profile information and account settings

**Key Components**:
- `Tabs` component for section organization
- `MCPServiceList` for service management
- `ThemeToggle` for appearance settings
- `Card` components for section organization

**Implementation Details**:
```typescript
<Tabs defaultValue="general" className="space-y-6">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="integrations">Integrations</TabsTrigger>
    <TabsTrigger value="account">Account</TabsTrigger>
  </TabsList>

  <TabsContent value="integrations">
    <Card>
      <CardHeader>
        <CardTitle>Development Tools</CardTitle>
        <CardDescription>
          Connect with your development tools using MCP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MCPServiceList />
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

### Project Management Page
**Location**: `src/app/project-management/page.tsx`

**Purpose**: Unified interface for project management tool integration and workflow analysis.

**Recent Changes** (Latest Update):
- Added `ProtectedRoute` wrapper for authentication
- Integrated `MainLayout` for consistent UI structure
- Maintained existing functionality while improving architecture consistency

**Features**:
- **Data Synchronization**: Real-time sync with Jira, Azure DevOps
- **Workflow Analysis**: AI-powered insights into team processes
- **Team Insights**: Understanding team dynamics and communication patterns
- **Three Main Tabs**:
  1. **Dashboard**: Project overview and status cards
  2. **Workflow Analysis**: Process mining and bottleneck detection
  3. **Project Overview**: Detailed project view with codebase integration

**Architecture**:
```typescript
function ProjectManagementContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Project Management
            </h1>
            <p className="text-gray-600">
              Unified view of your project management tools and team workflows
            </p>
          </div>
          <div className="flex space-x-3">
            {/* Action buttons */}
          </div>
        </div>

        {/* Feature overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Status cards for different features */}
        </div>

        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="dashboard">
            <ProjectDashboard />
          </TabsContent>
          <TabsContent value="workflow-analysis">
            <WorkflowAnalysis />
          </TabsContent>
          <TabsContent value="project-overview">
            <UnifiedProjectOverview projectId={selectedProjectId} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default function ProjectManagementPage() {
  return (
    <ProtectedRoute>
      <ProjectManagementContent />
    </ProtectedRoute>
  );
}
```

**Integration Status**:
- ✅ Complete REST endpoints for PM data
- ✅ MCP Integration with Jira and Azure DevOps
- ✅ Database models for projects, work items, teams
- ✅ Analytics engine for workflow analysis
- ✅ Frontend components for dashboard and analysis

## Page-Specific Components

### Project Management Components

#### ProjectDashboard
Displays project cards, team metrics, and work item summaries.

**Features**:
- Project status visualization with real-time sync
- Team velocity tracking and completion metrics
- Work item distribution across different statuses
- Recent activity timeline for each project
- Empty state with service configuration guidance using Settings icon
- Quick navigation to project details and external links

#### WorkflowAnalysis
Provides insights into team processes and workflow patterns.

**Features**:
- Process mining visualization
- Bottleneck identification
- Team collaboration analysis
- Performance metrics and trends

#### UnifiedProjectOverview
Detailed project view combining PM data with codebase insights.

**Features**:
- Project-specific dashboard
- Codebase integration display
- Team member mapping
- Historical analysis and trends

## Navigation and Routing

### App Router Structure
```
src/app/
├── layout.tsx              # Root layout
├── page.tsx               # Home page
├── dashboard/
│   └── page.tsx           # Dashboard page
├── project-management/
│   └── page.tsx           # Project management page
├── settings/
│   └── page.tsx           # Settings page
└── auth/
    ├── login/
    │   └── page.tsx       # Login page
    └── register/
        └── page.tsx       # Registration page
```

### Navigation Integration
- Sidebar navigation in `MainLayout`
- Breadcrumb support for deep navigation
- Active page highlighting
- Role-based menu item visibility

## State Management

### Page-Level State
Pages manage their own local state using React hooks:

```typescript
const [activeTab, setActiveTab] = useState('dashboard');
const [selectedProject, setSelectedProject] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Global State
Accessed through context providers:
- Authentication state via `AuthProvider`
- Theme preferences via `ThemeProvider`
- Application settings via custom contexts

## Error Handling

### Page-Level Error Boundaries
```typescript
function PageContent() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6 bg-destructive/10 border-destructive/20">
            <h2 className="text-destructive font-semibold mb-2">
              Something went wrong
            </h2>
            <p className="text-destructive/80">{error}</p>
            <Button 
              onClick={() => setError(null)} 
              className="mt-4"
            >
              Try Again
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Normal page content
}
```

### Loading States
Consistent loading state implementation across pages:

```typescript
if (loading) {
  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    </MainLayout>
  );
}
```

## SEO and Meta Data

### Page Metadata
Each page includes appropriate metadata:

```typescript
export const metadata = {
  title: 'Project Management - RampForgeAI',
  description: 'Unified view of your project management tools and team workflows',
};
```

### Dynamic Metadata
For pages with dynamic content:

```typescript
export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Project ${params.id} - RampForgeAI`,
    description: 'Detailed project overview and analytics',
  };
}
```

## Performance Optimization

### Code Splitting
- Automatic code splitting via Next.js
- Dynamic imports for heavy components
- Lazy loading for non-critical content

### Data Fetching
- Server-side rendering where appropriate
- Client-side fetching for dynamic content
- Proper loading states and error handling
- Caching strategies for API responses

## Testing Pages

### Page Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import ProjectManagementPage from './page';

test('renders project management page', () => {
  render(
    <AuthProvider>
      <ProjectManagementPage />
    </AuthProvider>
  );
  
  expect(screen.getByText('Project Management')).toBeInTheDocument();
});
```

### End-to-End Testing
```typescript
test('complete project management workflow', async ({ page }) => {
  await page.goto('/project-management');
  
  // Verify page loads
  await expect(page.locator('h1')).toContainText('Project Management');
  
  // Test tab navigation
  await page.click('[data-testid="workflow-analysis-tab"]');
  await expect(page.locator('[data-testid="workflow-content"]')).toBeVisible();
  
  // Test project selection
  await page.click('[data-testid="project-card-1"]');
  await expect(page.locator('[data-testid="project-overview"]')).toBeVisible();
});
```