import React from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import Login from './components/Login';
import Layout from './components/Layout';

// Wrapper component to handle conditional rendering based on auth state
const AppContent: React.FC = () => {
  const { currentUser } = useWorkspace();

  // If not logged in, show the Login screen
  if (!currentUser) {
    return <Login />;
  }

  // Once logged in, show the main Layout (Sidebar, Editor, Tools)
  return <Layout />;
};

const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
};

export default App;