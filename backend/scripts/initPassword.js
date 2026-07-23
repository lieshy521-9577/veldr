import { testConnections, syncDatabases, closeConnections } from '../config/databases.js';
import { getOrCreatePasswordRecord } from '../controllers/passwordController.js';

const initPasswordOnly = async () => {
  try {
    await getOrCreatePasswordRecord();
    console.log('Password table initialized');
  } catch (error) {
    console.error('Password table initialization failed:', error);
    throw error;
  }
};

const initPassword = async () => {
  try {
    const connected = await testConnections();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const synced = await syncDatabases();
    if (!synced) {
      throw new Error('Database sync failed');
    }

    await initPasswordOnly();
  } catch (error) {
    console.error('Password initialization failed:', error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  initPassword()
    .then(async () => {
      await closeConnections();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Script failed:', error);
      await closeConnections();
      process.exit(1);
    });
}

export { initPassword, initPasswordOnly };
export default initPassword;
