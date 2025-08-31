import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';

describe('Card Components', () => {
  it('renders Card with children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default Card classes', () => {
    const { container } = render(
      <Card>
        <div>Content</div>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('rounded-lg', 'border', 'border-gray-200', 'bg-white', 'shadow-sm');
  });

  it('renders CardHeader with proper classes', () => {
    render(
      <CardHeader>
        <div>Header content</div>
      </CardHeader>
    );

    const header = screen.getByText('Header content').parentElement;
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('renders CardTitle with headline font', () => {
    render(<CardTitle>Test Title</CardTitle>);

    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('font-headline', 'text-lg', 'font-semibold');
  });

  it('renders CardDescription with proper styling', () => {
    render(<CardDescription>Test description</CardDescription>);

    const description = screen.getByText('Test description');
    expect(description).toHaveClass('text-sm', 'text-gray-600');
  });

  it('renders CardContent with padding', () => {
    render(
      <CardContent>
        <div>Content</div>
      </CardContent>
    );

    const content = screen.getByText('Content').parentElement;
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('renders CardFooter with flex layout', () => {
    render(
      <CardFooter>
        <div>Footer</div>
      </CardFooter>
    );

    const footer = screen.getByText('Footer').parentElement;
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('applies custom className to Card', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});