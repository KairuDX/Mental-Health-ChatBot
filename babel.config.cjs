module.exports = {
    "presets": [["module:metro-react-native-babel-preset", { "useTransformReactJSXExperimental": true }]],
    plugins: [
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
      }]
    ]
  };