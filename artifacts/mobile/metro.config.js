const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Deduplicate critical packages to avoid "Invalid hook call" errors
// caused by multiple instances of React in the pnpm workspace.
const pnpm = path.resolve(workspaceRoot, "node_modules/.pnpm");
config.resolver.extraNodeModules = {
  react: path.resolve(pnpm, "react@19.1.0/node_modules/react"),
  "react-dom": path.resolve(pnpm, "react-dom@19.1.0_react@19.1.0/node_modules/react-dom"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "@tanstack/react-query": path.resolve(
    pnpm,
    "@tanstack+react-query@5.100.9_react@19.1.0/node_modules/@tanstack/react-query"
  ),
};

module.exports = config;
