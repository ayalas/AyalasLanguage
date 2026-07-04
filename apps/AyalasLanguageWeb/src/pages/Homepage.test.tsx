import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Homepage from './Homepage'; // Adjust path as needed
import { LEANRING_STATUS } from '../constants/learning';
import disableClientValidation from '@ayalaslanguage/types/test-utils';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock react-router-dom
const mockUseOutletContext = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => mockUseOutletContext(),
  };
});

// Mock external components and icons to keep the snapshot clean
vi.mock('../components/auth/AuthHeader', async () => {
  const actual = await vi.importActual('../components/auth/AuthHeader');
  return {
    ...actual,
    AuthHeader: () => <div data-testid="auth-header" />,
  };
});

vi.mock('lucide-react', () => ({
  LayersPlus: () => <span data-testid="icon-layers" />,
  Check: () => <span data-testid="icon-check" />,
  CircleDotDashed: () => <span data-testid="icon-progress" />,
  History: () => <span data-testid="icon-history" />,
}));

describe('Homepage Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockUser = {
    disablePuter: true,
    languageSettings: {
      targetLanguageId: 1,
      knownLanguageId: 2,
    },
  };

  it('renders the no-language message when user has no language settings', async () => {
    mockUseOutletContext.mockReturnValue({ user: { languageSettings: null } });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    // Call the specific function requested
    disableClientValidation();

    const emptyMsg = await screen.findByText(/You have not selected which language to learn/i);
    expect(emptyMsg).toBeInTheDocument();
  });

  it('renders an empty state when language is set but no paths return from API', async () => {
    mockUseOutletContext.mockReturnValue({ user: mockUser });
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    disableClientValidation();

    const emptyMsg = await screen.findByText(/It looks like there are not yet any lessons/i);
    expect(emptyMsg).toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/learning/path');
  });

  it('renders learning levels and lessons when data is fetched successfully', async () => {
    const mockData = [
      {
        learningPathId: 10,
        level: 1,
        chapter: 1,
        name: 'Basics',
        status: LEANRING_STATUS.DONE,
        exerciseCount: 15,
        practiseMistakesInThisPath: false,
      },
      {
        learningPathId: 11,
        level: 1,
        chapter: 2,
        name: 'Greetings',
        status: LEANRING_STATUS.IN_PROGRESS,
        exerciseCount: 11,
        practiseMistakesInThisPath: true,
      },
    ];

    mockUseOutletContext.mockReturnValue({ user: mockUser });
    mockedAxios.get.mockResolvedValue({ data: mockData });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    disableClientValidation();

    // Check for Level Heading
    const levelHeading = await screen.findByText('Level 1');
    expect(levelHeading).toBeInTheDocument();

    // Check for Lesson Names
    expect(screen.getByText('Basics')).toBeInTheDocument();
    expect(screen.getByText('Greetings')).toBeInTheDocument();

    // Check for Status Icons
    expect(await screen.findByTestId('icon-check')).toBeInTheDocument();
    expect(await screen.findByTestId('icon-progress')).toBeInTheDocument();
    expect(await screen.findByTestId('icon-history')).toBeInTheDocument();
    
    // Check for Exercise Count
    expect(screen.getByText('[15]')).toBeInTheDocument();
    expect(screen.getByText('[11]')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    mockUseOutletContext.mockReturnValue({ user: mockUser });
    
    // Simulating an axios error that the errorHandler utility would catch
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    disableClientValidation();

    // Note: The visibility of this depends on how your errorHandler works.
    // If errorHandler calls setError(err.message), this will pass.
    const errorLabel = await screen.findByText(errorMessage);
    expect(errorLabel).toBeInTheDocument();
  });
});