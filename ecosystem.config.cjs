module.exports = {
  apps: [
    {
      name: "orvenix",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 0.0.0.0 --port 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};

