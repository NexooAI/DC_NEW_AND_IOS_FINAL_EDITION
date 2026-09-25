import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { KycFormV2, FormData } from "../../components/kycV2/KycFormV2";

const mockFormData: FormData = {
  doorno: "12A",
  street: "Main Bazaar",
  area: "Town Area",
  city: "Alangulam",
  district: "Tenkasi",
  state: "Tamil Nadu",
  country: "India",
  pincode: "627851",
  dob: "15/08/1995",
  addressprooftype: "aadhar",
  idNumber: "123456789012",
  nominee_name: "Ramesh",
  nominee_relationship: "brother",
};

describe("KycFormV2 Component", () => {
  const mockHandleChange = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockHandleBack = jest.fn();
  const mockSetActiveSection = jest.fn();
  const mockHandlePincodeChange = jest.fn();
  const mockHandleCitySelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header and trust badge", () => {
    const { getByText } = render(
      <KycFormV2
        formData={mockFormData}
        handleChange={mockHandleChange}
        handleSubmit={mockHandleSubmit}
        handleBack={mockHandleBack}
        activeSection="identity"
        setActiveSection={mockSetActiveSection}
        errors={{}}
        pincodeData={[]}
        isLoadingPincode={false}
        pincodeLookupFailed={false}
        handlePincodeChange={mockHandlePincodeChange}
        handleCitySelection={mockHandleCitySelection}
        idTypes={[{ name: "Aadhar", value: "aadhar" }]}
        nomineeRelationship={[{ name: "Brother", value: "brother" }]}
      />
    );

    expect(getByText("KYC Details")).toBeTruthy();
    expect(getByText("Update your personal information")).toBeTruthy();
    expect(getByText("Your details are safe and secured with us")).toBeTruthy();
  });

  it("renders identity details section when active", () => {
    const { getByText, getByPlaceholderText } = render(
      <KycFormV2
        formData={mockFormData}
        handleChange={mockHandleChange}
        handleSubmit={mockHandleSubmit}
        handleBack={mockHandleBack}
        activeSection="identity"
        setActiveSection={mockSetActiveSection}
        errors={{}}
        pincodeData={[]}
        isLoadingPincode={false}
        pincodeLookupFailed={false}
        handlePincodeChange={mockHandlePincodeChange}
        handleCitySelection={mockHandleCitySelection}
        idTypes={[{ name: "Aadhar", value: "aadhar" }]}
        nomineeRelationship={[{ name: "Brother", value: "brother" }]}
      />
    );

    expect(getByText("Identity Details")).toBeTruthy();
    expect(getByText("Date of Birth")).toBeTruthy();
    expect(getByText("Address Proof Type")).toBeTruthy();
    expect(getByText("ID Number")).toBeTruthy();
    expect(getByText("Continue to Address")).toBeTruthy();
    expect(getByText("Address Details")).toBeTruthy();
    expect(getByText("Nominee Details (Optional)")).toBeTruthy();

    fireEvent.press(getByText("Continue to Address"));
    expect(mockSetActiveSection).toHaveBeenCalledWith("address");
  });

  it("renders address section fields when activeSection is address", () => {
    const { getByText } = render(
      <KycFormV2
        formData={mockFormData}
        handleChange={mockHandleChange}
        handleSubmit={mockHandleSubmit}
        handleBack={mockHandleBack}
        activeSection="address"
        setActiveSection={mockSetActiveSection}
        errors={{}}
        pincodeData={[]}
        isLoadingPincode={false}
        pincodeLookupFailed={false}
        handlePincodeChange={mockHandlePincodeChange}
        handleCitySelection={mockHandleCitySelection}
        idTypes={[{ name: "Aadhar", value: "aadhar" }]}
        nomineeRelationship={[{ name: "Brother", value: "brother" }]}
      />
    );

    expect(getByText("Pincode")).toBeTruthy();
    expect(getByText("City / Town")).toBeTruthy();
    expect(getByText("Door No. / Flat No.")).toBeTruthy();
    expect(getByText("Street / Road Name")).toBeTruthy();
    expect(getByText("Area / Locality")).toBeTruthy();
    expect(getByText("Continue to Nominee")).toBeTruthy();

    fireEvent.press(getByText("Continue to Nominee"));
    expect(mockSetActiveSection).toHaveBeenCalledWith("nominee");
  });

  it("renders nominee section fields and triggers submit when activeSection is nominee", () => {
    const { getByText } = render(
      <KycFormV2
        formData={mockFormData}
        handleChange={mockHandleChange}
        handleSubmit={mockHandleSubmit}
        handleBack={mockHandleBack}
        activeSection="nominee"
        setActiveSection={mockSetActiveSection}
        errors={{}}
        pincodeData={[]}
        isLoadingPincode={false}
        pincodeLookupFailed={false}
        handlePincodeChange={mockHandlePincodeChange}
        handleCitySelection={mockHandleCitySelection}
        idTypes={[{ name: "Aadhar", value: "aadhar" }]}
        nomineeRelationship={[{ name: "Brother", value: "brother" }]}
      />
    );

    expect(getByText("Nominee Full Name")).toBeTruthy();
    expect(getByText("Relationship with Nominee")).toBeTruthy();
    expect(getByText("Submit KYC Verification")).toBeTruthy();

    fireEvent.press(getByText("Submit KYC Verification"));
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("resolveKycVersion logic", () => {
  const { resolveKycVersion } = require("../../hooks/useAppVisibility");

  it("prioritizes explicit toggle switch enableKycV2 / showKycV2", () => {
    expect(resolveKycVersion({ enableKycV2: 0 })).toBe(1);
    expect(resolveKycVersion({ enableKycV2: 1 })).toBe(2);
    expect(resolveKycVersion({ showKycV2: 0 })).toBe(1);
    expect(resolveKycVersion({ showKycV2: 1 })).toBe(2);
    expect(resolveKycVersion({ enable_kyc_v2: 0 })).toBe(1);
    expect(resolveKycVersion({ enable_kyc_v2: 1 })).toBe(2);
  });

  it("handles version strings and numbers from API", () => {
    expect(resolveKycVersion({ kycScreenVersion: "v1" })).toBe(1);
    expect(resolveKycVersion({ kycScreenVersion: "v2" })).toBe(2);
    expect(resolveKycVersion({ kycVersion: 1 })).toBe(1);
    expect(resolveKycVersion({ kycVersion: 2 })).toBe(2);
    expect(resolveKycVersion({ kyc_version: "v1" })).toBe(1);
    expect(resolveKycVersion({ kyc_version: "v2" })).toBe(2);
  });

  it("falls back to theme config default (2) when visibleData has no kyc settings", () => {
    expect(resolveKycVersion({})).toBe(2);
    expect(resolveKycVersion(null)).toBe(2);
  });
});
