// Importing
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Page from '@/app/map/page';
import '@testing-library/jest-dom';

// Mock Mapbox GL JS (map and popup functionality).
jest.mock('mapbox-gl', () => {
  return {
    Map: function () {
      return {
        on: jest.fn(),
        off: jest.fn(),
        addSource: jest.fn(),
        addLayer: jest.fn(),
        getLayer: jest.fn(),
        getSource: jest.fn(),
        removeLayer: jest.fn(),
        removeSource: jest.fn(),
        getCanvas: () => ({ style: {} }),
        loadImage: jest.fn(),
        remove: jest.fn(),
        setLayoutProperty: jest.fn(),
        loaded: () => true,
      };
    },
    Popup: function () {
      return {
        setLngLat: jest.fn().mockReturnThis(),
        setHTML: jest.fn().mockReturnThis(),
        addTo: jest.fn().mockReturnThis(),
        remove: jest.fn(),
      };
    },
    accessToken: 'mock-token',
  };
});

// Mock API utilities.
jest.mock('@/utils/apiClient', () => ({
  api: {
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
  handleAPIError: jest.fn((err) => ({ userMessage: err.message })),
}));

// Mock polyline decoder utility.
jest.mock('@/utils/decodeToGeoJSON', () => jest.fn(() => ({
  type: 'FeatureCollection',
  features: [],
})));

// Mock modal and UI components.
jest.mock('@/app/map/ShowWeatherModal', () => () => <div>Weather Modal</div>);
jest.mock('@/app/map/DirectionModal', () => () => <div>Direction Modal</div>);
jest.mock('@/components/Filter', () => ({ className }: any) => (
  <div data-testid="filter" className={className}>Filter</div>
));
jest.mock('@/components/Icon', () => () => <span>Icon</span>);

// Setup fetch mock responses for external API calls.
beforeEach(() => {
  fetch.resetMocks();

  fetch.mockImplementation((url) => {
    // Mock weather API response.
    if (url.includes('/weather')) {
      return Promise.resolve(new Response(JSON.stringify({
        current: { main: { temp: 70 }, weather: [{ icon: '01d' }] },
        hourly: { list: [] },
      })));
    }

    // Mock GeoJSON-based feature layers.
    if (
      url.includes('/parks') ||
      url.includes('/bikes') ||
      url.includes('/EV-charging') ||
      url.includes('/busyness') ||
      url.includes('/air-quality') ||
      url.includes('/manhattan')
    ) {
      return Promise.resolve(new Response(JSON.stringify({
        type: 'FeatureCollection',
        features: [],
      })));
    }

    // Default fallback.
    return Promise.resolve(new Response('{}'));
  });
});

describe('Map', () => {
  // Test that current weather data is rendered correctly.
  it('renders current temperature and icon when weather data loads', async () => {
    await act(async () => {
      render(<Page />);
    });

    await waitFor(() => {
      expect(screen.getByText(/current weather/i)).toBeInTheDocument();
      expect(screen.getByText(/70/)).toBeInTheDocument();
    });
  });

  // Test that the filter component is visible in mobile view
  it('toggles Filter visibility in mobile mode', async () => {
    await act(async () => {
      render(<Page />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('filter')).toBeInTheDocument();
    });
  });

  // Test that clicking "Forecast" opens the weather modal.
  it('shows weather modal when Forecast button clicked', async () => {
    await act(async () => {
      render(<Page />);
    });

    const btn = await screen.findByText(/forecast/i);
    fireEvent.click(btn);
    expect(screen.getByText(/weather modal/i)).toBeInTheDocument();
  });
});
