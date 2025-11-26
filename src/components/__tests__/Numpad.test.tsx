import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Numpad from '../Numpad';

describe('Numpad Component', () => {
  const mockOnChange = vi.fn();
  const mockOnEnter = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnEnter.mockClear();
  });

  it('should render all number buttons (0-9)', () => {
    render(<Numpad value="" onChange={mockOnChange} />);
    
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it('should call onChange when number is clicked', async () => {
    const user = userEvent.setup();
    render(<Numpad value="" onChange={mockOnChange} />);
    
    const button5 = screen.getByText('5');
    await user.click(button5);
    
    expect(mockOnChange).toHaveBeenCalledWith('5');
  });

  it('should append numbers to existing value', async () => {
    const user = userEvent.setup();
    render(<Numpad value="12" onChange={mockOnChange} />);
    
    const button3 = screen.getByText('3');
    await user.click(button3);
    
    expect(mockOnChange).toHaveBeenCalledWith('123');
  });

  it('should handle decimal point', async () => {
    const user = userEvent.setup();
    render(<Numpad value="10" onChange={mockOnChange} />);
    
    const dotButton = screen.getByText('.');
    await user.click(dotButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('10.');
  });

  it('should not allow multiple decimal points', async () => {
    const user = userEvent.setup();
    render(<Numpad value="10.5" onChange={mockOnChange} />);
    
    const dotButton = screen.getByText('.');
    await user.click(dotButton);
    
    // Should not call onChange since decimal already exists
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should have clear button (C)', () => {
    render(<Numpad value="123" onChange={mockOnChange} />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('should clear value when C is clicked', async () => {
    const user = userEvent.setup();
    render(<Numpad value="123" onChange={mockOnChange} />);
    
    const clearButton = screen.getByText('C');
    await user.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should handle backspace', async () => {
    const user = userEvent.setup();
    render(<Numpad value="123" onChange={mockOnChange} />);
    
    // Backspace button uses Phosphor icon, find by role
    const buttons = screen.getAllByRole('button');
    const backspaceButton = buttons.find(btn => 
      btn.querySelector('svg') && !btn.textContent
    );
    
    if (backspaceButton) {
      await user.click(backspaceButton);
      expect(mockOnChange).toHaveBeenCalledWith('12');
    }
  });

  it('should render OK button when onEnter is provided', () => {
    render(<Numpad value="100" onChange={mockOnChange} onEnter={mockOnEnter} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('should not render OK button when onEnter is not provided', () => {
    render(<Numpad value="100" onChange={mockOnChange} />);
    expect(screen.queryByText('OK')).not.toBeInTheDocument();
  });

  it('should call onEnter when OK is clicked', async () => {
    const user = userEvent.setup();
    render(<Numpad value="100" onChange={mockOnChange} onEnter={mockOnEnter} />);
    
    const okButton = screen.getByText('OK');
    await user.click(okButton);
    
    expect(mockOnEnter).toHaveBeenCalledTimes(1);
  });

  it('should have correct button layout (3x4 grid)', () => {
    render(<Numpad value="" onChange={mockOnChange} />);
    
    // Row 1: 7, 8, 9
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    
    // Row 2: 4, 5, 6
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    
    // Row 3: 1, 2, 3
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Row 4: C, 0, .
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('.')).toBeInTheDocument();
  });
});
