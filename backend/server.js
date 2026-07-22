import { app, PORT } from './app.js';
import { testConnections, syncDatabases } from './config/databases.js';
import { initPasswordOnly } from './scripts/initPassword.js';

// Create HTTP server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://0.0.0.0:${PORT}/api`);
  console.log(`External access: http://43.130.238.216:${PORT}/api`);
});

// Test database connection and sync models
const startServer = async () => {
  try {
    // Test all database connections
    const connected = await testConnections();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Sync all database models
    const synced = await syncDatabases();
    if (!synced) {
      throw new Error('Database sync failed');
    }
    
    // Initialize password table (只初始化，不重复连接数据库)
    await initPasswordOnly();
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start the application
startServer();
