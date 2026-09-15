/// <reference types="nativewind/types" />

declare module "*.css" {
  const content: any;
  export default content;
}

declare module "../global.css";
declare module "./global.css";

import "react-native";
declare module "react-native" {
  namespace StyleSheet {
    const absoluteFillObject: {
      position: "absolute";
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    };
  }
}
