// Importing.
import { render, screen, fireEvent } from '@testing-library/react';
import ShowWeatherModal from '@/app/map/ShowWeatherModal';
import '@testing-library/jest-dom';
import { act } from 'react';

jest.useFakeTimers();

const mockSetShowModal = jest.fn();

const mockCurrent = {
  weather: [{ icon: '01d' }],
  main: { temp: 75.3, humidity: 50, feels_like: 74.1 },
  wind: { speed: 10 },
};

const mockHourly = Array.from({ length: 18 }, (_, i) => ({
  weather: [{ icon: '01d' }],
  main: {
    temp: 70 + i,
    humidity: 40 + i,
    feels_like: 69 + i,
  },
  wind: { speed: 5 + i },
  dt: Math.floor(Date.now() / 1000) + i * 3600,
}));

describe('ShowWeatherModal', () => {

  // Test 1: Testing if modal renders current weather and hourly forecast data.
  it('renders modal with current weather and hourly data', () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={mockCurrent}
        hourly={mockHourly}
      />
    );

    expect(screen.getAllByText(/Humidity:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Feels like:/i).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(1);
  });

  // Test 2: Testing if exactly 18 hourly cards are displayed when data is available.
  it('displays up to 18 hourly forecast cards', () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={mockCurrent}
        hourly={mockHourly}
      />
    );

    const tempLabels = screen.getAllByText(/°F/);
    expect(tempLabels.length).toBeGreaterThanOrEqual(18);
  });

  // Test 3: Checking if a weather card flips when clicked.
  it('flips a card on click', () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={mockCurrent}
        hourly={mockHourly}
      />
    );

    const allCards = document.querySelectorAll('.card-container');
    const firstCard = allCards[0] as HTMLElement;

    expect(firstCard.querySelector('.card')?.classList).not.toContain('flipped');

    fireEvent.click(firstCard);
    expect(firstCard.querySelector('.card')?.classList).toContain('flipped');
  });

  // Test 4: Checking if the time shown in the modal updates correctly over time.
  it('displays updated Manhattan time', async () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={mockCurrent}
        hourly={mockHourly}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const allTimes = screen.getAllByText(
      (content) => content.includes('AM') || content.includes('PM')
    );
    expect(allTimes.length).toBeGreaterThan(0);
  });

  // Test 5: Checking if clicking the exit button closes the modal.
  it('closes modal when ✕ button is clicked', () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={mockCurrent}
        hourly={mockHourly}
      />
    );

    const closeButton = screen.getByRole('button', { name: /✕/ });
    fireEvent.click(closeButton);
    expect(mockSetShowModal).toHaveBeenCalledWith(false);
  });

  // Test 6: Testing if it shows "Loading" state when current data is null.
  it('shows loading state when current is null', () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={null}
        hourly={mockHourly}
      />
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  // Test 7: Testing if it shows "Loading" state when hourly data is null.
  it('shows loading state when hourly is null', () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={mockCurrent}
        hourly={null}
      />
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  // Test 8: Testing if it renders no cards if hourly array is empty.
  it('renders no hourly cards when hourly data is empty', () => {
    render(
      <ShowWeatherModal
        setShowModal={mockSetShowModal}
        current={mockCurrent}
        hourly={[]}
      />
    );

    expect(document.querySelectorAll('.card-container').length).toBe(0);
  });
});