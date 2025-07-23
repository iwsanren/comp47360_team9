// Importing.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectionSection from '@/app/map/DirectionSection';

// Mocking all state handler props.
const mockSetClickPoints = jest.fn();
const mockSetStartLocation = jest.fn();
const mockSetStartCoords = jest.fn();
const mockSetDestCoords = jest.fn();
const mockSetDestination = jest.fn();
const mockHandleClear = jest.fn();
const mockSetOpen = jest.fn();
const mockSetTool = jest.fn();

// Reusable base props for the component.
const baseProps = {
  setClickPoints: mockSetClickPoints,
  setStartLocation: mockSetStartLocation,
  setStartCoords: mockSetStartCoords,
  setDestCoords: mockSetDestCoords,
  destCoords: { lat: 40.785091, lng: -73.968285 },
  startLocation: 'Times Square',
  startCoords: { lat: 40.758896, lng: -73.985130 },
  setDestination: mockSetDestination,
  destination: 'Central Park',
  isLoadingDirection: false,
  handleClear: mockHandleClear,
  tool: null,
  setOpen: mockSetOpen,
  methods: [],
  setTool: mockSetTool,
  routes: {},
  greenScoreforEachRoute: [],
  isInValid: false,
};

describe('DirectionSection', () => {
  // Test 1: Rendering warning when the location is marked invalid.
  test('shows invalid location warning', () => {
    render(<DirectionSection {...baseProps} isInValid={true} />);
    expect(
      screen.getByText(/Invalid position/i)
    ).toBeInTheDocument();
  });

  // Test 2: Rendering loading message if route is being fetched.
  test('shows loading message when isLoadingDirection is true', () => {
    render(<DirectionSection {...baseProps} isLoadingDirection={true} />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  // Test 3: Verifies that the "Clear" button triggers the handler function.
  test('calls handleClear when Clear button is clicked', () => {
    render(<DirectionSection {...baseProps} />);
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    expect(mockHandleClear).toHaveBeenCalled();
  });
});