import AppRouter from './router/AppRouter';
import { WebSocketProvider } from './context/WebSocketContext';
import { LiveNotificationContainer } from './components/LiveNotification';

function App() {
  return (
    <WebSocketProvider>
      <div className="app-container">
        <LiveNotificationContainer />
        <AppRouter />
      </div>
    </WebSocketProvider>
  );
}

export default App;
