import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/database';
import { Database, Wifi, WifiOff, RefreshCw, HardDrive } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const checkConnection = async () => {
    try {
      const info = await databaseService.getConnectionInfo();
      setConnectionInfo(info);
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const success = await databaseService.reconnect();
      if (success) {
        await checkConnection();
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Check connection status every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!connectionInfo) {
    return null;
  }

  const isMongoConnected = connectionInfo.mode === 'mongodb' && connectionInfo.isConnected;
  const isLocalStorage = connectionInfo.mode === 'localStorage';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium
        ${isMongoConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }
      `}>
        {isMongoConnected ? (
          <>
            <Database className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <span>MongoDB Connected</span>
          </>
        ) : isLocalStorage ? (
          <>
            <HardDrive className="w-4 h-4" />
            <WifiOff className="w-4 h-4" />
            <span>Using Local Storage</span>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="ml-2 p-1 hover:bg-yellow-200 rounded transition-colors"
              title="Try to reconnect to MongoDB"
            >
              <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
            </button>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Disconnected</span>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="ml-2 p-1 hover:bg-yellow-200 rounded transition-colors"
              title="Try to reconnect"
            >
              <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};