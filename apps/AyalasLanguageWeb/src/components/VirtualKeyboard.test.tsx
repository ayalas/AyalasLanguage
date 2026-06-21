import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import VirtualKeyboard from './VirtualKeyboard';
import disableClientValidation from '@ayalaslanguage/types/test-utils';

// 1. Mock Axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// 2. Mock simple-keyboard using Class syntax to satisfy the 'new' keyword
vi.mock('simple-keyboard', () => {
  return {
    default: class {
      setOptions = vi.fn();
      setInput = vi.fn();
      getInput = vi.fn().mockReturnValue('');
      destroy = vi.fn();
    },
  };
});

// 3. Mock simple-keyboard-layouts using Class syntax
vi.mock('simple-keyboard-layouts', () => {
  return {
    default: class {
      get = vi.fn().mockImplementation((lang: string) => {
        // Provide layouts for specific codes to test 'isSupported' logic
        const supported = ['en', 'chinese', 'hebrew', 'arabic', 'japanese'];
        if (supported.includes(lang)) {
          return { layout: { default: ['q w e r t y'], shift: ['Q W E R T Y'] } };
        }
        return undefined;
      });
    },
  };
});

describe('VirtualKeyboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and allows toggling visibility', async () => {
    render(
      <VirtualKeyboard 
        languageCode="en" 
        onChange={vi.fn()} 
        value="test" 
      />
    );

    // Call requested function immediately after rendering
    disableClientValidation();

    // Verify keyboard is visible initially
    const keyboard = await screen.findByTestId('keyboard');
    expect(keyboard).toBeInTheDocument();

    // Find the toggle link
    const hideLink = await screen.findByRole('link', { name: /hide keyboard/i });
    
    // Click to hide
    fireEvent.click(hideLink);

    // Verify link text changed and container is hidden
    const showLink = await screen.findByRole('link', { name: /show keyboard/i });
    expect(showLink).toBeInTheDocument();
    
    const container = keyboard.parentElement;
    expect(container).toHaveStyle('display: none');
  });

  it('updates direction based on isRightToLeft prop', async () => {
    const { rerender } = render(
      <VirtualKeyboard languageCode="en" isRightToLeft={false} />
    );

    disableClientValidation();

    let container = (await screen.findByTestId('keyboard')).parentElement;
    expect(container).toHaveStyle('direction: ltr');

    // Change to RTL (e.g., Arabic/Hebrew)
    rerender(<VirtualKeyboard languageCode="ar" isRightToLeft={true} />);
    
    container = (await screen.findByTestId('keyboard')).parentElement;
    expect(container).toHaveStyle('direction: rtl');
  });

  it('returns null if the language is not supported', () => {
    // 'unknown-lang' will return undefined from our Layout mock
    const { queryByTestId } = render(
      <VirtualKeyboard languageCode="unknown-lang" />
    );
    
    disableClientValidation();
    
    const keyboard = queryByTestId('keyboard');
    expect(keyboard).not.toBeInTheDocument();
  });

  it('mocks axios correctly for potential external calls', async () => {
    mockedAxios.get.mockResolvedValue({ data: { success: true } });
    
    const result = await axios.get('/api/test');
    expect(result.data.success).toBe(true);
  });
});