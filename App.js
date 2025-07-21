import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';
import store from './src/store/store';

// Import navigation
import { AppWithNavigation } from './src/navigation/AppNavigator';

// Import database initialization
import { initDatabase } from './src/db/queries';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Database initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  if (isLoading) {
    return null;
  }

  return <AppWithNavigation store={store} />;
}


export default App;
