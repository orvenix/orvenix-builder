module.exports = {
  apps: [
    {
      name: "orvenix-staging",
      cwd: __dirname,
      script: "npm",
      args: "run start:staging",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        ORVENIX_STORAGE_MODE: "file",
      },
    },
  ],
};
