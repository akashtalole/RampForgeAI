import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import MainLayout from '../MainLayout';
import { useAuth } from '@/components/auth/AuthProvider';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock AuthProvider
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock the MainLayout component's dependencies
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'developer',
  skills: ['JavaScript', 'React'],
  is_active: true,
};

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('MainLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      isLoading: false,
    });
    mockUsePathname.mockReturnValue('/dashboard');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the layout with sidebar navigation', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check if logo is rendered
    expect(screen.getByText('RampForgeAI')).toBeInTheDocument();
    
    // Check if navigation items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Code Analysis')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Assistant')).toBeInTheDocument();
    expect(screen.getByText('Learning Paths')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check if user info is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    
    // Check if content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('bg-primary', 'text-white');
  });

  it('opens mobile sidebar when menu button is clicked', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    // Find and click the mobile menu button
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    // The sidebar should be visible (transform class changes)
    const sidebar = screen.getByRole('navigation').closest('div');
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('calls logout function when sign out button is clicked', () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      login: jest.fn(),
      register: jest.fn(),
      isLoading: false,
    });

    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('displays correct page title in top bar', () => {
    mockUsePathname.mockReturnValue('/analysis');
    
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Code Analysis')).toBeInTheDocument();
  });
});