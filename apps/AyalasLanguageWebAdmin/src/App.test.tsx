import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import  LoginPage  from './pages/auth/LoginPage';
import  ExercisesGrid from './components/ExercisesGrid';
import {LearningPathPage} from './pages/content/LearningPathPage';
import { CONTENT_STATUS, EXERCISE_TYPES } from '@ayalaslanguage/types/exercise';
import disableClientValidation from '@ayalaslanguage/types/test-utils';
import type { IRowExercise } from './types/grids/grids';

/*
const mockData = Array.from({ length: 101 }, (_, i) => ({
                userId: i,
                exerciseId: i,
                learningPathId: i,
                exerciseTypeId: EXERCISE_TYPES.COMMON_RESPONSES,
                exerciseType: "Common Responses",
                email: 'test@test.com',
                name: `Exercise ${i}`,
                knownLanguage: 'English',
                targetLanguage: 'Danish',
                data: 'data',
                status: CONTENT_STATUS.DRAFT,
                createdOn: new Date().toISOString()
            } as IRowExercise));
*/

// 1. Setup Hoisting-Safe Mocks
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock ag-grid modules to be completely empty
vi.mock('ag-grid-community', () => ({
  AllCommunityModule: {},
}));

// Mock ag-grid-react with a functional ref handler
vi.mock('ag-grid-react', async () => {
  const ReactActual = await import('react');
  return {
    AgGridProvider: ({ children }: any) => children,
    AgGridReact: ReactActual.forwardRef((props: any, ref: any) => {
      ReactActual.useImperativeHandle(ref, () => ({
        api: {
          getSelectedNodes: vi.fn(() => [
            { data: { exerciseId: 101, learningPathId: 5 } }
          ]),
          refreshCells: vi.fn(),
        }
      }));
      return <div data-testid="mock-grid">Grid Rows: {props.rowData?.length}</div>;
    }),
  };
});

// Mock AuthContext/AuthProvider to prevent the infinite loop in the source code
vi.mock('./components/auth/AuthContext', async () => {
  const ReactActual = await import('react');
  const MockContext = ReactActual.createContext({
    user: { userId: 1, role: 1, userName: 'admin@test.com' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn()
  });
  return {
    AuthProvider: ({ children }: any) => (
      <MockContext.Provider value={{ 
        user: { userId: 1, role: 1, userName: 'admin@test.com' }, 
        loading: false, 
        login: vi.fn(), 
        logout: vi.fn() 
      }}>
        {children}
      </MockContext.Provider>
    ),
    default: MockContext
  };
});

// Mock useAuth to return the stable mock user
vi.mock('./components/auth/useAuth', () => ({
  useAuth: () => ({
    user: { userId: 1, role: 1, userName: 'admin@test.com' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn()
  })
}));

// Mock react-router-dom context for ProtectedRoutes/AuthHeader
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useOutletContext: () => ({
      user: { userId: 1, role: 1, userName: 'admin@test.com' },
      logout: vi.fn(),
      login: vi.fn(),
    }),
  };
});



describe('Admin Console Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockedAxios as any).defaults = { withCredentials: true };
    
    // Global GET interceptor
    mockedAxios.get.mockImplementation((_url: string) => {
      return Promise.resolve({ data: { data: [], numOfRecords: 0 } });
    });
  });

  describe('LoginPage', () => {
    it('should login successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { user: { userId: 1, role: 1 }, requires2FA: false }
      });

      render(
        <AuthProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      );

      fireEvent.change(await screen.findByTestId('email'), { target: { value: 'admin@test.com' } });
      fireEvent.change(await screen.findByTestId('password'), { target: { value: 'pass' } });

      disableClientValidation();
      fireEvent.click(await screen.findByTestId('log-in'));

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/admin/api/auth/login', expect.anything());
      });
    });
  });

  describe('Pagination Logic', () => {
    it('should load the second page of exercises', async () => {
      // Return 500 items to ensure the 'Next' button is enabled
      const mockData = Array.from({ length: 101 }, (_, i) => ({
                userId: i,
                exerciseId: i,
                learningPathId: i,
                exerciseTypeId: EXERCISE_TYPES.COMMON_RESPONSES,
                exerciseType: "Common Responses",
                email: 'test@test.com',
                name: `Exercise ${i}`,
                knownLanguage: 'English',
                targetLanguage: 'Danish',
                data: 'data',
                status: CONTENT_STATUS.DRAFT,
                createdOn: new Date().toISOString()
            } as IRowExercise));

      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/api/exercises/')) {
          return Promise.resolve({ data: { data: mockData, numOfRecords: 500 } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <AuthProvider>
          <MemoryRouter>
            <ExercisesGrid />
          </MemoryRouter>
        </AuthProvider>
      );

      const nextButton = await screen.findByTestId('next');

      // Wait for the GenericGrid's useEffect to process the mock response and enable the button
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      }, { timeout: 8000 });

      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        // GenericGrid uses (page - 1). Page 2 click should request index /1
        const call = mockedAxios.get.mock.calls.find(c => c[0].includes('/api/exercises/1'));
        expect(call).toBeDefined();
      });
    });
  });

  describe('Ref-based Actions', () => {
    it('should trigger multi-status update', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { data: [{ exerciseId: 101, status: 0 }], numOfRecords: 1 }
      });

      render(
        <AuthProvider>
          <MemoryRouter>
            <ExercisesGrid />
          </MemoryRouter>
        </AuthProvider>
      );

      const filterSelectors = await screen.findAllByTestId('contentstatusfilter');
      const multiSelect = filterSelectors[1];

      mockedAxios.post.mockResolvedValue({ data: {} });

      // Wrap calls that trigger gridRef.current.api access in act()
      await act(async () => {
        fireEvent.change(multiSelect, { target: { value: '1' } });
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/admin/api/multisetexercisestatus',
        expect.objectContaining({ status: 1 })
      );
    });
  });

  describe('LearningPathPage', () => {
    it('should render lesson info', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/admin/api/learning-path/5')) {
          return Promise.resolve({ 
            data: { name: 'Verbs', level: 1, chapter: 1, status: 1, email: 'a@b.com' } 
          });
        }
        return Promise.resolve({ data: { data: [], numOfRecords: 0 } });
      });

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/path/5']}>
            <Routes>
              <Route path="/path/:learningPathId" element={<LearningPathPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      expect(await screen.findByRole('heading', { name: /Lesson 1-1: Verbs/i })).toBeInTheDocument();
    });
  });
});