import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCard, CodeAnalysisIcon } from '../DashboardCard';

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Test Card',
    description: 'This is a test card description',
    action: 'Get Started',
    icon: <CodeAnalysisIcon />,
    status: 'available' as const,
  };

  it('renders card with all content', () => {
    render(<DashboardCard {...defaultProps} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('This is a test card description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('displays correct status badge for available status', () => {
    render(<DashboardCard {...defaultProps} status="available" />);
    
    const badge = screen.getByText('Available');
    expect(badge).toHaveClass('bg-accent', 'text-white');
  });

  it('displays correct status badge for in-progress status', () => {
    render(<DashboardCard {...defaultProps} status="in-progress" />);
    
    const badge = screen.getByText('In Progress');
    expect(badge).toHaveClass('bg-yellow-500', 'text-white');
  });

  it('displays correct status badge for completed status', () => {
    render(<DashboardCard {...defaultProps} status="completed" />);
    
    const badge = screen.getByText('Completed');
    expect(badge).toHaveClass('bg-green-500', 'text-white');
  });

  it('calls onClick handler when button is clicked', () => {
    const mockOnClick = jest.fn();
    render(<DashboardCard {...defaultProps} onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Get Started' });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <DashboardCard {...defaultProps} className="custom-class" />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders icon correctly', () => {
    render(<DashboardCard {...defaultProps} />);
    
    // Check if SVG icon is rendered by looking for the svg element
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });
});