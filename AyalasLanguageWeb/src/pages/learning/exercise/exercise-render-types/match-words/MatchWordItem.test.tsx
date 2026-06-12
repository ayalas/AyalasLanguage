import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import React from 'react';
import { MatchWordItem } from './MatchWordItem';
import type { MatchSelection } from './MatchWordItem';
import disableClientValidation from '../../../../../utils/test-utils/disableClientValidation';

// Mock axios as requested
vi.mock('axios');
const mockedAxios = vi.mocked(axios);


describe('MatchWordItem', () => {
  const mockProps = {
    itemValue: 'Apple',
    matchingValue: 'Pomme',
    setSelected: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the itemValue text', async () => {
    render(<MatchWordItem {...mockProps} />);
    const button = await screen.findByTestId('click-button');
    expect(button).toHaveTextContent('Apple');
  });

  it('toggles selection and calls setSelected when clicked', async () => {
    render(<MatchWordItem {...mockProps} />);

    // Call required external function before clicking
    disableClientValidation();

    const button = await screen.findByTestId('click-button');

    // 1. First click: Select
    await fireEvent.click(button);

    expect(mockProps.setSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        itemValue: 'Apple',
        matchingValue: 'Pomme',
      }),
      expect.any(Function), // setToDone
      expect.any(Function)  // setToError
    );
    expect(button).toHaveClass('match-words-item-selected');

    // 2. Second click: Deselect
    await fireEvent.click(button);
    expect(mockProps.setSelected).toHaveBeenLastCalledWith(null, expect.any(Function), expect.any(Function));
    expect(button).not.toHaveClass('match-words-item-selected');
  });

  it('updates UI to "done" state when parent calls the provided setToDone function', async () => {
    let capturedSetToDone: () => void = () => {};
    
    const mockSetSelected = vi.fn((obj, doneFn) => {
      capturedSetToDone = doneFn;
    });

    render(<MatchWordItem {...mockProps} setSelected={mockSetSelected} />);
    
    disableClientValidation();
    const button = await screen.findByTestId('click-button');

    // Click to trigger setSelected and capture the function
    await fireEvent.click(button);

    // Call the captured function inside act()
    act(() => {
      capturedSetToDone();
    });

    expect(button).toHaveClass('match-words-item-done');
    expect(button).not.toHaveClass('match-words-item-selected');
    
    // Clicking when done should do nothing
    await fireEvent.click(button);
    expect(mockSetSelected).toHaveBeenCalledTimes(1); // Should not have been called again
  });

  it('updates UI to "error" state when parent calls the provided setErrorState function', async () => {
    let capturedSetErrorState: (v: boolean) => void = () => {};
    
    const mockSetSelected = vi.fn((obj, doneFn, errorFn) => {
      capturedSetErrorState = errorFn;
    });

    render(<MatchWordItem {...mockProps} setSelected={mockSetSelected} />);
    
    disableClientValidation();
    const button = await screen.findByTestId('click-button');

    // Click to capture the error function
    await fireEvent.click(button);

    act(() => {
      capturedSetErrorState(true);
    });

    expect(button).toHaveClass('match-words-item-error');

    // Clicking again should reset error state
    await fireEvent.click(button);
    expect(button).not.toHaveClass('match-words-item-error');
  });

  it('maintains state correctly through multiple class changes', async () => {
    let captured: any = {};
    const mockSetSelected = vi.fn((obj, doneFn, errorFn) => {
      captured = { doneFn, errorFn };
    });

    render(<MatchWordItem {...mockProps} setSelected={mockSetSelected} />);
    
    disableClientValidation();
    const button = await screen.findByTestId('click-button');

    await fireEvent.click(button);

    // Test Error state
    act(() => captured.errorFn(true));
    expect(button).toHaveClass('match-words-item-error');

    // Test Done state (which should clear error)
    act(() => captured.doneFn());
    expect(button).toHaveClass('match-words-item-done');
    expect(button).not.toHaveClass('match-words-item-error');
  });
});