// versionCode must increase on every build so a new APK installs over the old one.
module.exports = ({ config }) => ({
  ...config,
  android: { ...config.android, versionCode: Number(process.env.GITHUB_RUN_NUMBER || 1) },
});
