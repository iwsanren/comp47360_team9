// src/tests/DirectionModal.test.tsx

// Importing.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectionModal from '@/app/map/DirectionModal';

const mockSetOpen = jest.fn();
const mockSetNavigation = jest.fn();

// Data simulating two route paths with distance, duration, and steps.
const mockData = {
  method: 'walking',
  paths: [
    {
      legs: [
        {
          distance: { text: '5 km', value: 5000 },
          duration: { text: '10 mins', value: 600 },
          steps: [
            { distance: { text: '1 km', value: 1000 }, html_instructions: 'Turn <b>right</b>' },
            { distance: { text: '4 km', value: 4000 }, html_instructions: 'Continue straight' },
          ],
        },
      ],
      overview_polyline: { points: 'abcd' },
    },
    {
      legs: [
        {
          distance: { text: '6 km', value: 6000 },
          duration: { text: '12 mins', value: 720 },
          steps: [],
        },
      ],
      overview_polyline: { points: 'efgh' },
    },
  ],
  greenScores: [20, 50],
};

// Additional mock data to test driving route selection logic.
const mockDrivingData = {
  method: 'driving',
  paths: [
    {
      legs: [
        {
          distance: { text: '9 km', value: 9000 },
          duration: { text: '15 mins', value: 900 },
          steps: [],
        },
      ],
      overview_polyline: { points: 'abcd' },
    },
    {
      legs: [
        {
          distance: { text: '5 km', value: 5000 },
          duration: { text: '10 mins', value: 600 },
          steps: [],
        },
      ],
      overview_polyline: { points: 'efgh' },
    },
  ],
  greenScores: [],
};

// Test 1: Testing the walking route.
describe('DirectionModal', () => {
  // Resetting mock functions before each test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with route options and steps', () => {
    // Render component with route 1 selected.
    render(
      <DirectionModal
        data={mockData}
        setOpen={mockSetOpen}
        setNavigation={mockSetNavigation}
        navigation={{
          steps: mockData.paths[0].legs[0].steps,
          overview_polyline: mockData.paths[0].overview_polyline,
          key: 0,
        }}
      />
    );

    // Assert that route info and step instructions appear.
    expect(screen.getByText('Route 1')).toBeInTheDocument();        
    expect(screen.getByText(/5 km/i)).toBeInTheDocument();           
    expect(screen.getByText(/10 mins/i)).toBeInTheDocument();       
    expect(screen.getByText(/Turn/i)).toBeInTheDocument();           
  });

  // Test 2: Testing if clicking the close button triggers proper handlers.
  test('clicking close button triggers setOpen and clears navigation', () => {
    // Render component again with route 1 selected.
    render(
      <DirectionModal
        data={mockData}
        setOpen={mockSetOpen}
        setNavigation={mockSetNavigation}
        navigation={{
          steps: mockData.paths[0].legs[0].steps,
          overview_polyline: mockData.paths[0].overview_polyline,
          key: 0,
        }}
      />
    );

    // Simulate clicking the close button.
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    // Expecting state handlers to have been triggered correctly.
    expect(mockSetOpen).toHaveBeenCalledWith(false);              
    expect(mockSetNavigation).toHaveBeenCalledWith(undefined);  
  });

  // Test 3: Testing driving routes as they ignore green scores and pick the shortest distance.
  test('selects shortest route for driving method', () => {
    
    render(
      <DirectionModal
        data={mockDrivingData}
        setOpen={mockSetOpen}
        setNavigation={mockSetNavigation}
        navigation={{
          steps: [],
          overview_polyline: mockDrivingData.paths[1].overview_polyline,
          key: 1,
        }}
      />
    );

    // Assert that shortest route info is rendered correctly.
    expect(screen.getByText('Route 2')).toBeInTheDocument();
    expect(screen.getByText(/5 km/i)).toBeInTheDocument();
    expect(screen.getByText(/10 mins/i)).toBeInTheDocument();
  });
});