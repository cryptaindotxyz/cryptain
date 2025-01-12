module.exports = {
  apps: [
    {
      name: 'cryptain-monitor',
      script: 'src/server/index.js',
      instances: 1,
      exec_mode: 'fork', // Use fork mode for monitor
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PM2_PROCESS_TYPE: 'monitor' // Flag to identify monitor process
      },
      // Ensure proper shutdown
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'cryptain-server',
      script: 'src/server/index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Use cluster mode for API servers
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PM2_PROCESS_TYPE: 'server' // Flag to identify server processes
      },
      // Ensure proper shutdown
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000,
    }
  ]
};