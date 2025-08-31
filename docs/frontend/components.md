# Frontend Components Documentation

## Component Architecture

### Layout Components

#### MainLayout
Primary layout wrapper providing consistent structure across all pages.

**Location**: `src/components/layout/MainLayout.tsx`

**Features**:
- Sidebar navigation with role-based menu items
- Header with user profile and theme toggle
- Responsive design for mobile/desktop
- Breadcrumb navigation support

**Usage**:
```typescript
import MainLayout from '@/components/layout/MainLayout';

function MyPage() {
  return (
    <MainLayout>
      <div>Page content</div>
    </MainLayout>
  );
}
```

### Authentication Components

#### ProtectedRoute
Higher-order component that wraps pages requiring authentication.

**Location**: `src/components/auth/ProtectedRoute.tsx`

**Features**:
- JWT token validation
- Automatic redirect to login
- Loading states during auth check
- Role-based access control

**Usage**:
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function SecurePage() {
  return (
    <ProtectedRoute>
      <PageContent />
    </ProtectedRoute>
  );
}
```

#### AuthProvider
Context provider for authentication state management.

**Location**: `src/components/auth/AuthProvider.tsx`

**Features**:
- Global auth state management
- Token refresh handling
- User profile management
- Login/logout functionality

### MCP Integration Components

#### MCPServiceList
Main component for managing MCP service connections.

**Location**: `src/components/mcp/MCPServiceList.tsx`

**Features**:
- Display all configured MCP services
- Real-time connection status
- Bulk operations (sync all, health check all)
- Service management actions

**Props**:
```typescript
interface MCPServiceListProps {
  // No props - manages its own state
}
```

**State Management**:
- Fetches services from `/api/v1/mcp/services`
- Handles loading, error, and success states
- Provides real-time status updates

#### MCPServiceForm
Form component for adding/editing MCP service configurations.

**Location**: `src/components/mcp/MCPServiceForm.tsx`

**Features**:
- Dynamic form fields based on service type
- Credential validation and secure handling
- Advanced settings (rate limits, timeouts)
- Real-time form validation

**Props**:
```typescript
interface MCPServiceFormProps {
  service?: MCPService;
  onSubmit: (service: MCPService) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Service Types Supported**:
- GitHub (Personal Access Token)
- GitLab (Personal Access Token)
- Jira (Username + API Token)
- Azure DevOps (Organization + PAT)
- Confluence (Username + API Token)

#### MCPServiceCard
Individual service display card with action buttons.

**Location**: `src/components/mcp/MCPServiceCard.tsx`

**Features**:
- Service status visualization
- Quick action buttons (connect, disconnect, edit, delete)
- Health check functionality
- Last connection timestamp

### Project Management Components

#### ProjectDashboard
Main dashboard showing project overview and statistics.

**Location**: `src/components/project-management/ProjectDashboard.tsx`

**Features**:
- Project cards with status indicators and real-time sync capabilities
- Team velocity metrics and completion tracking
- Work item summaries with progress visualization
- Recent activity timeline for each project
- Empty state with service configuration guidance
- Quick action buttons and external project links

**Key Components Used**:
- Lucide React icons: `Users`, `CheckCircle`, `Clock`, `AlertCircle`, `TrendingUp`, `RefreshCw`, `ExternalLink`, `Calendar`, `Settings`
- Progress bars for completion rate visualization
- Badge components for project types and work item statuses
- Card layouts for organized project information display

**State Management**:
- Real-time dashboard data fetching from `/api/v1/project-management/dashboard`
- Sync functionality with loading states and error handling
- Fallback to mock data when API is unavailable
- Empty state handling with configuration prompts using Settings icon

#### WorkflowAnalysis
Component for analyzing team workflows and processes.

**Location**: `src/components/project-management/WorkflowAnalysis.tsx`

**Features**:
- Process mining visualization
- Bottleneck detection
- Team collaboration patterns
- Performance metrics

#### UnifiedProjectOverview
Detailed project view combining multiple data sources.

**Location**: `src/components/project-management/UnifiedProjectOverview.tsx`

**Features**:
- Codebase integration with PM data
- Architecture visualization
- Team member mapping
- Historical analysis

**Props**:
```typescript
interface UnifiedProjectOverviewProps {
  projectId: string;
}
```

### Analysis Page Components

#### AnalysisContent
Main component for the code analysis page providing comprehensive codebase analysis interface.

**Location**: `src/app/analysis/page.tsx`

**Features**:
- Repository selection grid with visual status indicators
- Multi-tab analysis results display (Overview, Architecture, Features, Recommendations)
- Interactive complexity scoring with color-coded indicators
- Progress tracking for analysis operations
- Mock data fallback for development and testing

**State Management**:
```typescript
interface Repository {
  id: string;
  name: string;
  url: string;
  type: string;
  last_analyzed?: string;
  analysis_status?: string;
}

interface AnalysisResult {
  id: string;
  repository_id: string;
  complexity_score: number;
  feature_count: number;
  architecture: ArchitectureData;
  features: Feature[];
  patterns: CodePattern[];
  recommendations: Recommendation[];
  created_at: string;
}
```

**Key Features**:
- **Repository Grid**: Visual selection interface with status badges and type indicators
- **Analysis Triggering**: On-demand analysis with progress tracking and polling
- **Tabbed Results**: Four main sections for organized data presentation
- **Visual Metrics**: Progress bars, complexity scoring, and confidence indicators
- **Error Handling**: Comprehensive error states with fallback mechanisms

**API Integration**:
- Fetches repositories from `/api/v1/repositories`
- Retrieves analysis results from `/api/v1/repositories/{id}/analysis`
- Triggers analysis via POST to `/api/v1/repositories/{id}/analyze`
- Implements polling for long-running analysis tasks

### UI Components

#### Card Components
Reusable card components following design system.

**Location**: `src/components/ui/Card.tsx`

**Variants**:
- `Card`: Base card container
- `CardHeader`: Header section with title/description
- `CardContent`: Main content area
- `CardTitle`: Styled title component
- `CardDescription`: Styled description component

**Usage**:
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

#### Button Component
Styled button with multiple variants.

**Location**: `src/components/ui/Button.tsx`

**Variants**:
- `primary`: Main action button
- `outline`: Secondary action button
- `ghost`: Minimal button style
- `destructive`: Delete/danger actions

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### Tabs Component
Tabbed interface component.

**Location**: `src/components/ui/tabs.tsx`

**Components**:
- `Tabs`: Container component
- `TabsList`: Tab navigation list
- `TabsTrigger`: Individual tab button
- `TabsContent`: Tab content panel

#### ThemeToggle
Theme switching component for light/dark mode.

**Location**: `src/components/ui/ThemeToggle.tsx`

**Features**:
- Light/dark theme switching
- System preference detection
- Persistent theme storage
- Smooth transitions

## Component Patterns

### Error Handling
All components implement consistent error handling:

```typescript
const [error, setError] = useState<string | null>(null);

// Display errors
{error && (
  <Card className="p-4 bg-destructive/10 border-destructive/20">
    <div className="flex items-center">
      <div className="text-destructive mr-3">⚠️</div>
      <div>
        <h3 className="text-destructive font-medium">Error</h3>
        <p className="text-destructive/80 text-sm">{error}</p>
      </div>
    </div>
  </Card>
)}
```

### Loading States
Consistent loading state implementation:

```typescript
const [loading, setLoading] = useState(false);

// Loading spinner
{loading && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)}
```

### Form Validation
TypeScript-based form validation pattern:

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.field.trim()) {
    newErrors.field = 'Field is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Styling Guidelines

### Tailwind Classes
- Use design system tokens for colors
- Consistent spacing with Tailwind scale
- Responsive design with mobile-first approach
- Dark mode support with `dark:` variants

### Component Styling
- Extract reusable styles into component variants
- Use CSS-in-JS sparingly, prefer Tailwind
- Maintain consistent hover and focus states
- Follow accessibility guidelines for contrast

## Testing Components

### Unit Testing
```typescript
import { render, screen } from '@testing-library/react';
import { MCPServiceCard } from './MCPServiceCard';

test('renders service card with correct status', () => {
  const mockService = {
    id: '1',
    name: 'Test Service',
    status: 'connected'
  };
  
  render(<MCPServiceCard service={mockService} />);
  expect(screen.getByText('Test Service')).toBeInTheDocument();
});
```

### Integration Testing
```typescript
test('complete MCP service configuration flow', async () => {
  render(<MCPServiceList />);
  
  // Click add service
  fireEvent.click(screen.getByText('Add Service'));
  
  // Fill form
  fireEvent.change(screen.getByLabelText('Service Name'), {
    target: { value: 'My GitHub' }
  });
  
  // Submit
  fireEvent.click(screen.getByText('Add Service'));
  
  // Verify service appears
  await waitFor(() => {
    expect(screen.getByText('My GitHub')).toBeInTheDocument();
  });
});
```