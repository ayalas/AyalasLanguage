import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import { PublicHeader } from './PublicHeader'; // Adjust the import path as necessary
import disableClientValidation from '../utils/test-utils/disableClientValidation';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Mail: () => <div data-testid="mail-icon" />,
}));

// Mock the image asset
vi.mock('../assets/logo.jpg', () => ({
    default: 'test-file-stub',
}));

describe('PublicHeader Component', () => {
    it('renders the logo linking to home and the contact us link', async () => {
        render(
            <MemoryRouter>
                <PublicHeader />
            </MemoryRouter>
        );

        // Requirement: Call disableClientValidation after rendering
        disableClientValidation();

        // Find the logo link to /home
        // The link contains the image; we can find it by its destination
        const links = await screen.findAllByRole('link');
        const homeLink = links.find(link => link.getAttribute('href') === '/home');
        expect(homeLink).toBeInTheDocument();

        // Verify the logo image is inside the home link
        const logoImg = homeLink?.querySelector('img');
        expect(logoImg).toBeInTheDocument();
        expect(logoImg).toHaveClass('logo');

        // Find the Contact Us link asynchronously
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