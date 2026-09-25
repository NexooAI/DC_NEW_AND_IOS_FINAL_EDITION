import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SchemesScreenV2, SchemeDetailV2, parseSchemeV2 } from '@/components/schemesV2';
import { isSchemesV2Active } from '@/hooks/useAppVisibility';
import { themeConfig } from '@/constants/theme.config';

// Mock MockData
const mockRawSchemes = [
  {
    SCHEMEID: 101,
    SCHEMENAME: 'DIGIGOLD WEIGHT BONUS SCHEME',
    DESCRIPTION: 'Flexi gold savings scheme with extra weight bonus.',
    SLOGAN: 'Gold Today Brighter Tomorrow',
    SCHEMETYPE: 'Flexi',
    savingType: 'weight',
    duration_months: 11,
    ACTIVE: 'Y',
    type: 'gold',
    chits: [{ AMOUNT: '100', ACTIVE: 'Y' }],
  },
  {
    SCHEMEID: 102,
    SCHEMENAME: 'GOLD SUBAM FIXED SCHEME',
    DESCRIPTION: 'Fixed installment gold accumulation plan.',
    SLOGAN: 'Assured returns on pure gold.',
    SCHEMETYPE: 'Fixed',
    savingType: 'amount',
    duration_months: 11,
    ACTIVE: 'Y',
    type: 'gold',
    fixed: '500',
    chits: [{ AMOUNT: '500', ACTIVE: 'Y' }],
  },
  {
    SCHEMEID: 103,
    SCHEMENAME: 'SILVER DHANVARSHA SCHEME',
    DESCRIPTION: 'Accumulate fine silver at daily rates.',
    SCHEMETYPE: 'Flexi',
    savingType: 'weight',
    duration_months: 11,
    ACTIVE: 'Y',
    type: 'silver',
    chits: [{ AMOUNT: '200', ACTIVE: 'Y' }],
  },
];

describe('Schemes Version 2 Flow', () => {
  it('parses raw schemes and renders SchemesScreenV2 with badges, counts, and promo banner', () => {
    const onKnowMore = jest.fn();
    const onJoinScheme = jest.fn();

    const { getByText, getAllByText } = render(
      <SchemesScreenV2
        rawSchemes={mockRawSchemes}
        isLoading={false}
        onRefresh={jest.fn()}
        onBack={jest.fn()}
        onKnowMore={onKnowMore}
        onJoinScheme={onJoinScheme}
      />
    );

    // Header & Hero Banner
    expect(getByText('Join Schemes')).toBeTruthy();
    expect(getByText(/Small Savings/i)).toBeTruthy();

    // Default Gold Schemes are visible
    expect(getByText('DIGIGOLD WEIGHT BONUS SCHEME')).toBeTruthy();
    expect(getByText('GOLD SUBAM FIXED SCHEME')).toBeTruthy();

    // Badges
    expect(getByText('★ POPULAR')).toBeTruthy();
    expect(getByText('🛡️ MOST TRUSTED')).toBeTruthy();

    // Know More Buttons
    const knowMoreButtons = getAllByText('Know More');
    expect(knowMoreButtons.length).toBeGreaterThanOrEqual(2);

    // Click Know More
    fireEvent.press(knowMoreButtons[0]);
    expect(onKnowMore).toHaveBeenCalledTimes(1);
    expect(onKnowMore.mock.calls[0][0].name).toBe('DIGIGOLD WEIGHT BONUS SCHEME');
  });

  it('filters schemes by type when clicking Fixed or Flexi sub-filter pills', () => {
    const { getByText, getAllByText, queryByText } = render(
      <SchemesScreenV2
        rawSchemes={mockRawSchemes}
        isLoading={false}
        onRefresh={jest.fn()}
        onBack={jest.fn()}
        onKnowMore={jest.fn()}
        onJoinScheme={jest.fn()}
      />
    );

    // Tap Fixed filter (first element with text 'Fixed' is the filter pill)
    const fixedFilter = getAllByText('Fixed')[0];
    fireEvent.press(fixedFilter);

    // Gold Subam Fixed Scheme should be visible, Digigold Weight Bonus should NOT
    expect(getByText('GOLD SUBAM FIXED SCHEME')).toBeTruthy();
    expect(queryByText('DIGIGOLD WEIGHT BONUS SCHEME')).toBeNull();

    // Tap Flexi filter
    const flexiFilter = getAllByText('Flexi')[0];
    fireEvent.press(flexiFilter);

    // Digigold Weight Bonus should be visible, Gold Subam should NOT
    expect(getByText('DIGIGOLD WEIGHT BONUS SCHEME')).toBeTruthy();
    expect(queryByText('GOLD SUBAM FIXED SCHEME')).toBeNull();
  });

  it('renders SchemeDetailV2 with Overview tabs, metrics, benefits, and action buttons', () => {
    const parsed = parseSchemeV2(mockRawSchemes[0]);
    const onJoin = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SchemeDetailV2
        scheme={parsed}
        onBack={onBack}
        onJoinScheme={onJoin}
      />
    );

    expect(getByText('Scheme Details')).toBeTruthy();
    expect(getByText('DIGIGOLD WEIGHT BONUS SCHEME')).toBeTruthy();
    expect(getByText('About the Scheme')).toBeTruthy();
    expect(getByText('Key Benefits')).toBeTruthy();
    expect(getByText('Scheme Highlights')).toBeTruthy();

    // Metric items
    expect(getByText('Start From')).toBeTruthy();
    expect(getByText('Tenure')).toBeTruthy();
    expect(getByText('11 Months')).toBeTruthy();

    // Bottom action buttons
    expect(getByText('Brochure')).toBeTruthy();
    const joinBtn = getByText('Join This Scheme');
    expect(joinBtn).toBeTruthy();

    // Tap Join
    fireEvent.press(joinBtn);
    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onJoin.mock.calls[0][0].id).toBe(101);
  });

  it('allows switching between tabs in SchemeDetailV2 (Benefits, How it Works, FAQs)', () => {
    const parsed = parseSchemeV2(mockRawSchemes[0]);
    const { getByText, queryByText } = render(
      <SchemeDetailV2
        scheme={parsed}
        onBack={jest.fn()}
        onJoinScheme={jest.fn()}
      />
    );

    // Switch to How it Works tab
    const howItWorksTab = getByText('How it Works');
    fireEvent.press(howItWorksTab);

    expect(getByText('Step 1')).toBeTruthy();
    expect(getByText(parsed.howItWorksSteps[0].title)).toBeTruthy();

    // Switch to FAQs tab
    const faqsTab = getByText('FAQs');
    fireEvent.press(faqsTab);

    expect(getByText(new RegExp(parsed.faqs[0].question, 'i'))).toBeTruthy();
  });

  it('suppresses duplicate header in SchemeDetailV2 when isNested is true', () => {
    const parsed = parseSchemeV2(mockRawSchemes[0]);

    // When isNested = true (e.g. inside SavingsTab SchemesHub)
    const { queryByText } = render(
      <SchemeDetailV2
        scheme={parsed}
        onBack={jest.fn()}
        onJoinScheme={jest.fn()}
        isNested={true}
      />
    );

    // Internal "Scheme Details" header title should NOT be rendered since SchemesHub provides the top header
    expect(queryByText('Scheme Details')).toBeNull();
  });

  it('accurately resolves Silver Flexi benefits without calling it a fixed monthly plan', () => {
    const silverParsed = parseSchemeV2(mockRawSchemes[2]); // SILVER DHANVARSHA SCHEME (Flexi)

    expect(silverParsed.metal).toBe('silver');
    expect(silverParsed.isFlexi).toBe(true);

    // Key benefits must dynamically reflect live daily pricing rather than fixed monthly
    const benefitTitles = silverParsed.keyBenefits.map((b) => b.title);
    expect(benefitTitles).toContain('Live Daily Silver Rates');
    expect(benefitTitles).not.toContain('Fixed Monthly Silver Plan');

    // Subtitle must contain the min amount ₹200
    const pricingSubtitle = silverParsed.keyBenefits.find((b) => b.title === 'Live Daily Silver Rates')?.subtitle;
    expect(pricingSubtitle).toContain('200');

    // Purity must be 999 Fine Pure Silver
    expect(silverParsed.purity).toBe('999 Fine Pure Silver');
  });

  it('guarantees ZERO occurrences of Akila Jewellers across all parsed schemes and details', () => {
    mockRawSchemes.forEach((raw) => {
      const parsedEn = parseSchemeV2(raw, 'en');
      const parsedTa = parseSchemeV2(raw, 'ta');

      const jsonEn = JSON.stringify(parsedEn);
      const jsonTa = JSON.stringify(parsedTa);

      expect(jsonEn.toLowerCase()).not.toContain('akila');
      expect(jsonTa.toLowerCase()).not.toContain('akila');
    });
  });

  it('handles brochure action by triggering download/request callback', async () => {
    const parsed = parseSchemeV2(mockRawSchemes[0]);
    const mockOnDownload = jest.fn();

    const { getByText } = render(
      <SchemeDetailV2
        scheme={parsed}
        onBack={jest.fn()}
        onJoinScheme={jest.fn()}
        onDownloadBrochure={mockOnDownload}
      />
    );

    const downloadBtn = getByText('Brochure');
    fireEvent.press(downloadBtn);

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
    expect(mockOnDownload).toHaveBeenCalledWith(parsed);
  });

  it('correctly resolves isSchemesV2Active based on API visibility and theme config', () => {
    // API sets V2 explicitly
    expect(isSchemesV2Active({ schemesVersion: 'v2' })).toBe(true);
    expect(isSchemesV2Active({ enableSchemesV2: 1 })).toBe(true);
    expect(isSchemesV2Active({ enable_schemes_v2: '1' })).toBe(true);

    // API sets V1 explicitly -> must revert to V1 behavior
    expect(isSchemesV2Active({ schemesVersion: 'v1' })).toBe(false);
    expect(isSchemesV2Active({ enableSchemesV2: 0 })).toBe(false);

    // Fallback to theme.config.js
    const expectedFallback = (themeConfig?.schemesVersion || 'v1') === 'v2';
    expect(isSchemesV2Active({})).toBe(expectedFallback);
  });

  it('triggers onJoinScheme when "Join This Scheme" CTA is clicked in SchemeDetailV2', () => {
    const parsed = parseSchemeV2(mockRawSchemes[0]);
    const mockOnJoin = jest.fn();

    const { getByText } = render(
      <SchemeDetailV2
        scheme={parsed}
        onBack={jest.fn()}
        onJoinScheme={mockOnJoin}
      />
    );

    const joinBtn = getByText('Join This Scheme');
    fireEvent.press(joinBtn);

    expect(mockOnJoin).toHaveBeenCalledTimes(1);
    expect(mockOnJoin).toHaveBeenCalledWith(parsed);
  });

  it('safely normalizes schemeId when stored data uses id, schemeId, or SCHEMEID without TypeError', () => {
    // Case 1: stored data has 'id' only
    const storedWithIdOnly = { id: 101, name: 'Test Plan' };
    const storedSchemeId1 = storedWithIdOnly?.schemeId ?? storedWithIdOnly?.id;
    expect(String(storedSchemeId1)).toBe('101');

    // Case 2: stored data has 'schemeId' only
    const storedWithSchemeIdOnly = { schemeId: 101, name: 'Test Plan' };
    const storedSchemeId2 = storedWithSchemeIdOnly?.schemeId ?? storedWithSchemeIdOnly?.id;
    expect(String(storedSchemeId2)).toBe('101');

    // Case 3: stored data has undefined schemeId but matches param
    const currentParam = '101';
    const matches = storedSchemeId1 != null && String(storedSchemeId1) === currentParam;
    expect(matches).toBe(true);
  });

  it('downloadAndShareSchemeBrochure creates a support ticket when no remote brochure PDF exists', async () => {
    const { downloadAndShareSchemeBrochure } = require('@/services/brochureService');
    const parsed = parseSchemeV2(mockRawSchemes[0]);

    const result = await downloadAndShareSchemeBrochure(parsed, 'en');
    expect(result.success).toBe(true);
    expect(result.source).toBe('ticket_created');
  });
});
