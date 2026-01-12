// apps/example/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Help resolve packages that bun hoists differently
config.resolver.extraNodeModules = {
  '@expo/metro-runtime': path.resolve(projectRoot, 'node_modules/@expo/metro-runtime'),
};

module.exports = config;
