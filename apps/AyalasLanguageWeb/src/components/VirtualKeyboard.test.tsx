import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import VirtualKeyboard from './VirtualKeyboard';
// Mock your utility first
import * as utils from '../utils/utils';

// 1. Mock the touch device utility to always be false
vi.mock('../utils/utils', () => ({
  isTouchDevice: vi.fn(() => false),
}));

// 2. Mock simple-keyboard
vi.mock('simple-keyboard', () => {
  // Define a real class so the 'new' keyword works perfectly
  class MockKeyboard {
    setOptions = vi.fn();
    setInput = vi.fn();
    getInput = vi.fn().mockReturnValue('');
    destroy = vi.fn();
    
    // The constructor needs to accept the arguments passed by your component
    constructor(selector: string, options: any) {
      // You can capture options here if you need to test them later
    }
  }

  return {
    default: MockKeyboard,
  };
});

// 3. Mock simple-keyboard-layouts
vi.mock('simple-keyboard-layouts', () => {
  class MockLayouts {
    get = vi.fn().mockImplementation((lang: string) => {
      const supported = ['en', 'chinese', 'hebrew', 'arabic', 'japanese'];
      if (supported.includes(lang)) {
        return { 
          layout: { 
            default: ['q w e r t y'], 
            shift: ['Q W E R T Y'] 
          } 
        };
      }
      return undefined;
    });
  }

  return {
    default: MockLayouts,
  };
});

describe('VirtualKeyboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure it's not a touch device before every test
    vi.mocked(utils.isTouchDevice).mockReturnValue(false);
  });

  it('renders and allows toggling visibility', async () => {
    render(
      <VirtualKeyboard 
        languageCode="en" 
        onChange={vi.fn()} 
        value="" 
      />
    );

    // Using findBy because the keyboard initialization happens in a useEffect
    const keyboard = await screen.findByTestId('keyboard');
    expect(keyboard).toBeInTheDocument();

    const hideLink = await screen.findByText(/Hide Keyboard/i);
    fireEvent.click(hideLink);

    const container = keyboard.parentElement;
    expect(container).toHaveStyle('display: none');
  });

  it('returns null if the language is not supported', () => {
    const { queryByTestId } = render(
      <VirtualKeyboard languageCode="unsupported-lang" />
    );
    
    const keyboard = queryByTestId('keyboard');
    expect(keyboard).not.toBeInTheDocument();
  });
  
  it('returns null if it is a touch device', () => {
    vi.mocked(utils.isTouchDevice).mockReturnValue(true);
    
    const { queryByTestId } = render(
      <VirtualKeyboard languageCode="en" />
    );
    
    expect(queryByTestId('keyboard')).not.toBeInTheDocument();
  });
});