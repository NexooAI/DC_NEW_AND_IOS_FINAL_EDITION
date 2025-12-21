module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          jsxRuntime: "automatic",
        },
      ],
    ],
    plugins: [
      // 1️⃣ Worklets Core plugin — should be at the top
      "react-native-worklets-core/plugin",

      // 2️⃣ CSS interop setup for NativeWind
      require("react-native-css-interop/dist/babel-plugin").default,

      // 3️⃣ JSX transform for NativeWind + CSS interop
      [
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "automatic",
          importSource: "react-native-css-interop",
        },
      ],

      // 4️⃣ Module aliasing (optional but useful)
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
          },
        },
      ],

      // 5️⃣ Reanimated plugin — must be the LAST one
      [
        "react-native-reanimated/plugin",
        {
          relativeSourceLocation: true,
        },
      ],
    ],
  };
};
