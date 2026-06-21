import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // 1. Import userEvent
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import { PublicHeader } from './PublicHeader';
import disableClientValidation from '@ayalaslanguage/types/test-utils';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Mail: () => <div data-testid="mail-icon" />,
    SquareMenu: () => <div data-testid="square-icon" />,
}));

// Mock the image asset
vi.mock('../assets/logo.jpg', () => ({
    default: 'test-file-stub',
}));

describe('PublicHeader Component', () => {
    it('renders the logo linking to home and the contact us link after opening menu', async () => {
        const user = userEvent.setup(); // 2. Setup user instance
        
        render(
            <MemoryRouter>
                <PublicHeader />
            </MemoryRouter>
        );

        disableClientValidation();

        // Check Logo (Visible by default)
        const links = await screen.findAllByRole('link');
        const homeLink = links.find(link => link.getAttribute('href') === '/home');
        expect(homeLink).toBeInTheDocument();

        // 3. Find the menu trigger (the link wrapping the SquareMenu icon)
        const menuTrigger = screen.getByTestId('square-icon').closest('a');
        expect(menuTrigger).toBeInTheDocument();

        // 4. Click the menu to set isOpen to true
        await user.click(menuTrigger!);

        // 5. Now the Contact Us link should be available
        const contactLink = await screen.findByRole('link', { name: /contact us/i });
        expect(contactLink).toBeInTheDocument();
        expect(contactLink).toHaveAttribute('href', '/contactus');

        // Verify the Mail icon is rendered inside the contact link
        const mailIcon = screen.getByTestId('mail-icon');
        expect(contactLink).toContainElement(mailIcon);
    });

    it('has the correct layout classes', async () => {
        const { container } = render(
            <MemoryRouter>
                <PublicHeader />
            </MemoryRouter>
        );

        disableClientValidation();

        const headerRow = container.querySelector('.header-row');
        expect(headerRow).toBeInTheDocument();
        
        const headerTitle = container.querySelector('.header-title');
        expect(headerTitle).toBeInTheDocument();

        const headerLinks = container.querySelector('.header-links');
        expect(headerLinks).toBeInTheDocument();
    });
});