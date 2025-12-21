/**
 * Example usage of GoldSilverRateCard component
 * 
 * This file demonstrates how to use the GoldSilverRateCard component
 * with JSON data from an API or local data source.
 */

import React from "react";
import { View, ScrollView } from "react-native";
import GoldSilverRateCard from "./GoldSilverRateCard";

// Example 1: Using JSON data from API response
export const ExampleWithApiData = () => {
  // Simulated API response JSON
  const apiResponse = {
    goldRate: "11310",
    silverRate: "166",
    updatedAt: "2024-01-15T10:30:00Z"
  };

  return (
    <GoldSilverRateCard
      data={{
        goldRate: apiResponse.goldRate,
        silverRate: apiResponse.silverRate,
        updatedAt: apiResponse.updatedAt,
      }}
      onPress={() => {
        console.log("Rate card pressed");
        // Navigate to rates detail page or perform action
      }}
    />
  );
};

// Example 2: Using numeric values
export const ExampleWithNumericData = () => {
  const rateData = {
    goldRate: 11310,
    silverRate: 166,
  };

  return (
    <GoldSilverRateCard
      data={rateData}
    />
  );
};

// Example 3: Using with custom images
export const ExampleWithCustomImages = () => {
  const rateData = {
    goldRate: "11310",
    silverRate: "166",
  };

  return (
    <GoldSilverRateCard
      data={rateData}
      goldImage={require("../../assets/images/gold.png")}
      silverImage={require("../../assets/images/silver.png")}
      onPress={() => {
        // Handle press
      }}
    />
  );
};

// Example 4: Using with home screen API data structure
export const ExampleWithHomeScreenData = () => {
  // Simulated home screen API response structure
  const homeData = {
    data: {
      currentRates: {
        gold_rate: "11310",
        silver_rate: "166",
        updated_at: "2024-01-15T10:30:00Z"
      }
    }
  };

  if (homeData?.data?.currentRates?.gold_rate && homeData?.data?.currentRates?.silver_rate) {
    return (
      <GoldSilverRateCard
        data={{
          goldRate: homeData.data.currentRates.gold_rate,
          silverRate: homeData.data.currentRates.silver_rate,
          updatedAt: homeData.data.currentRates.updated_at,
        }}
      />
    );
  }

  return null;
};

// Example 5: Complete usage in a screen
export const ExampleCompleteScreen = () => {
  // JSON data from API
  const ratesJson = {
    success: true,
    data: {
      goldRate: 11310,
      silverRate: 166,
      updatedAt: "2024-01-15T10:30:00Z"
    }
  };

  return (
    <ScrollView>
      <View style={{ padding: 20 }}>
        <GoldSilverRateCard
          data={{
            goldRate: ratesJson.data.goldRate,
            silverRate: ratesJson.data.silverRate,
            updatedAt: ratesJson.data.updatedAt,
          }}
          onPress={() => {
            // Navigate to rates page
            console.log("Navigate to rates detail");
          }}
        />
      </View>
    </ScrollView>
  );
};

