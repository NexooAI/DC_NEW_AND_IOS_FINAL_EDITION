import React from 'react';
import { render } from '@testing-library/react-native';
import { JoiningGiftBanner } from '../../components/JoiningGiftBanner';

describe('JoiningGiftBanner Component', () => {
  it('renders nothing when gift is null or undefined', () => {
    const { toJSON: toJSONNull } = render(<JoiningGiftBanner gift={null} />);
    expect(toJSONNull()).toBeNull();

    const { toJSON: toJSONUndefined } = render(<JoiningGiftBanner gift={undefined} />);
    expect(toJSONUndefined()).toBeNull();
  });

  it('renders correctly in ALLOTTED status (Ready at store badge)', () => {
    const giftMock = {
      gift_name: '0.250g Gold Coin',
      status: 'ALLOTTED',
      weight_grams: 0.25,
      sku: 'GFT-GOLD-COIN-025',
    };

    const { getByTestId, getByText, queryByText } = render(<JoiningGiftBanner gift={giftMock} />);

    // Check banner presence
    expect(getByTestId('joining-gift-banner')).toBeTruthy();

    // Check gift title
    expect(getByTestId('gift-name').props.children).toBe('0.250g Gold Coin');

    // Check status pill
    expect(getByTestId('gift-status').props.children).toBe('READY AT STORE');

    // Check promotional text
    expect(getByText('Promotional Gift Allotted')).toBeTruthy();
    expect(queryByText(/Visit your nearest branch showroom/i)).toBeTruthy();
  });

  it('renders correctly in DELIVERED status (Collected badge)', () => {
    const giftMock = {
      gift_name: '0.500g Silver Coin',
      status: 'DELIVERED',
      handover_date: '2026-09-26T12:00:00.000Z',
    };

    const { getByTestId, getByText, queryByText } = render(<JoiningGiftBanner gift={giftMock} />);

    // Check banner presence
    expect(getByTestId('joining-gift-banner')).toBeTruthy();

    // Check gift name & status badge
    expect(getByTestId('gift-name').props.children).toBe('0.500g Silver Coin');
    expect(getByTestId('gift-status').props.children).toBe('COLLECTED');

    // Check delivered title & showroom receipt notice
    expect(getByText('Promotional Gift Delivered')).toBeTruthy();
    expect(queryByText(/Gift received at showroom/i)).toBeTruthy();
  });
});
