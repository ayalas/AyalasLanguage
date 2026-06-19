import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BucketListItem from './BucketListItem';
import disableClientValidation from '../../../../../utils/test-utils/disableClientValidation';

// Mock axios as requested
vi.mock('axios');

describe('BucketListItem', () => {
  const mockProps = {
    itemValue: 'Test Item',
    position: 3,
    itemClicked: vi.fn(),
  };

  it('renders the item value correctly inside the button', async () => {
    render(
      <BucketListItem 
        itemValue={mockProps.itemValue} 
        position={mockProps.position} 
        itemClicked={mockProps.itemClicked} 
      />
    );

    // Using asynchronous find method as requested
    const button = await screen.findByRole('button', { name: /test item/i });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Test Item');
  });

  it('calls itemClicked with correct arguments when clicked', async () => {
    render(
      <BucketListItem 
        itemValue={mockProps.itemValue} 
        position={mockProps.position} 
        itemClicked={mockProps.itemClicked} 
      />
    );

    // Call disableClientValidation after rendering and before clicking
    disableClientValidation();

    // Locating element asynchronously via TestId as requested
    const button = await screen.findByTestId('click-button');

    // Perform click inside act
    await act(async () => {
      button.click();
    });

    expect(mockProps.itemClicked).toHaveBeenCalledTimes(1);
    expect(mockProps.itemClicked).toHaveBeenCalledWith('Test Item', 3);
  });

  it('prevents default behavior when the button is clicked', async () => {
    const itemClickedMock = vi.fn();
    render(
      <BucketListItem 
        itemValue="PreventDefault" 
        position={0} 
        itemClicked={itemClickedMock} 
      />
    );

    disableClientValidation();

    const button = await screen.findByRole('button');

    // Create a mock event to check preventDefault
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

    await act(async () => {
      button.dispatchEvent(clickEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(itemClickedMock).toHaveBeenCalledWith("PreventDefault", 0);
  });
});