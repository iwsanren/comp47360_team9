// Importing.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PredictionSection from '@/app/map/PredictionSection';
import '@testing-library/jest-dom';
import fetchData from '@/utils/fetchData';

// Mock the fetchData util.
jest.mock('@/utils/fetchData');

// Mock Mapbox functions.
const mockSetData = jest.fn();
const mockAddSource = jest.fn();
const mockAddLayer = jest.fn();
const mockGetSource = jest.fn();

// Creating a mocked map object.
const mockMap = {
  getSource: mockGetSource,
  addSource: mockAddSource,
  addLayer: mockAddLayer,
} as any;

describe('PredictionSection', () => {
  // Reset all mocks before each test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Rendering both sliders and the Get Prediction button.
  it('renders sliders and button', () => {
    render(<PredictionSection map={mockMap} layerName="busyness-prediction" busynessLayerSetting={{}} />);
    expect(screen.getByText('Get Prediction')).toBeInTheDocument();
    expect(screen.getAllByRole('slider').length).toBe(2);
  });

  // Test 2: Simulating slider value changes and verifying the new values.
  it('updates sliders correctly on change', () => {
    render(<PredictionSection map={mockMap} layerName="busyness-prediction" busynessLayerSetting={{}} />);
    const sliders = screen.getAllByRole('slider');

    fireEvent.change(sliders[0], { target: { value: 1 } });
    fireEvent.change(sliders[1], { target: { value: 2 } });

    expect(sliders[0]).toHaveValue('1');
    expect(sliders[1]).toHaveValue('2');
  });

  // Test 3: Testing if source exists, fetchData should be called and setData applied.
  it('calls fetchData and setData if map source exists', async () => {
    const geojson = { type: 'FeatureCollection', features: [] };
    (fetchData as jest.Mock).mockResolvedValue(geojson);
    mockGetSource.mockReturnValue({ setData: mockSetData });

    render(<PredictionSection map={mockMap} layerName="busyness-prediction" busynessLayerSetting={{}} />);
    fireEvent.click(screen.getByText('Get Prediction'));

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
      expect(mockSetData).toHaveBeenCalledWith(geojson);
    });
  });

  // Test 4: Testing if source does not exist, source and layer should be added.
  it('adds source and layer if map source does not exist', async () => {
    const geojson = { type: 'FeatureCollection', features: [] };
    (fetchData as jest.Mock).mockResolvedValue(geojson);
    mockGetSource.mockReturnValue(undefined);

    render(<PredictionSection map={mockMap} layerName="busyness-prediction" busynessLayerSetting={{}} />);
    fireEvent.click(screen.getByText('Get Prediction'));

    await waitFor(() => {
      expect(mockAddSource).toHaveBeenCalled();
      expect(mockAddLayer).toHaveBeenCalled();
    });
  });

  // Test 5: Button should be disabled during async loading and re-enabled after.
  it('disables button during loading', async () => {
    (fetchData as jest.Mock).mockImplementation(() =>
      new Promise(res => setTimeout(() => res({ type: 'FeatureCollection', features: [] }), 200))
    );

    render(<PredictionSection map={mockMap} layerName="busyness-prediction" busynessLayerSetting={{}} />);
    const button = screen.getByRole('button', { name: 'Get Prediction' });

    fireEvent.click(button);
    expect(button).toBeDisabled();

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  // Test 6: Handles null map (no crash or error).
  it('does nothing if map is null', () => {
    render(<PredictionSection map={null} layerName="busyness-prediction" busynessLayerSetting={{}} />);
    fireEvent.click(screen.getByText('Get Prediction'));
  });

  // Test 7: Testing if changing the date resets the hour to 0.
  it('resets hour to 0 when date is changed', () => {
    render(<PredictionSection map={mockMap} layerName="busyness-prediction" busynessLayerSetting={{}} />);
    const [dateSlider, hourSlider] = screen.getAllByRole('slider');

    fireEvent.change(hourSlider, { target: { value: 3 } });
    expect(hourSlider).toHaveValue('3');

    fireEvent.change(dateSlider, { target: { value: 1 } });

    expect(hourSlider).toHaveValue('0');
  });
});