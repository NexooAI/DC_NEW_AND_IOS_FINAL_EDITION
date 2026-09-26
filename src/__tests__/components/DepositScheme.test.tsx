import { checkIsDeposit } from '../../components/DynamicSchemeCard';

describe('Deposit / Lumpsum Scheme Logic', () => {
  it('identifies deposit scheme by scheme_plan_type_id 5', () => {
    const scheme = {
      SCHEMEID: 101,
      SCHEMENAME: 'Gold Fixed Deposit',
      scheme_plan_type_id: 5,
    };
    expect(checkIsDeposit(scheme)).toBe(true);
  });

  it('identifies deposit scheme by SCHEME_PLAN_TYPE_ID 5', () => {
    const scheme = {
      SCHEMEID: 102,
      SCHEMENAME: 'Silver Term Deposit',
      SCHEME_PLAN_TYPE_ID: 5,
    };
    expect(checkIsDeposit(scheme)).toBe(true);
  });

  it('identifies deposit scheme by SCHEMETYPE containing deposit', () => {
    const scheme = {
      SCHEMEID: 103,
      SCHEMENAME: 'Lumpsum Gold Plan',
      SCHEMETYPE: 'deposit',
    };
    expect(checkIsDeposit(scheme)).toBe(true);
  });

  it('identifies deposit scheme by INS_TYPE containing one-time', () => {
    const scheme = {
      SCHEMEID: 104,
      SCHEMENAME: 'Single Shot Saver',
      INS_TYPE: 'one-time investment',
    };
    expect(checkIsDeposit(scheme)).toBe(true);
  });

  it('returns false for normal recurring chits / flexi schemes', () => {
    const recurringScheme = {
      SCHEMEID: 105,
      SCHEMENAME: '11 Months Gold Chit',
      SCHEMETYPE: 'fixed',
      INS_TYPE: 'monthly',
      scheme_plan_type_id: 1,
    };
    expect(checkIsDeposit(recurringScheme)).toBe(false);

    const flexiScheme = {
      SCHEMEID: 106,
      SCHEMENAME: 'Daily Flexi Savings',
      SCHEMETYPE: 'flexi',
      scheme_plan_type_id: 2,
    };
    expect(checkIsDeposit(flexiScheme)).toBe(false);

    expect(checkIsDeposit(null)).toBe(false);
    expect(checkIsDeposit(undefined)).toBe(false);
  });
});
