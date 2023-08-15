/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { getProvider, signTransaction } from './utils';

import { TLog, IBTCProvider } from './types';

import { Logs, Sidebar, NoProvider } from './components';

// =============================================================================
// Styled Components
// =============================================================================

const StyledApp = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// =============================================================================
// Constants
// =============================================================================

declare global {
  interface Window {
    ethereum: any;
  }
}
const sleep = (timeInMS) => new Promise((resolve) => setTimeout(resolve, timeInMS));

// =============================================================================
// Typedefs
// =============================================================================

export type ConnectedMethods =
  | {
      name: string;
      onClick: () => Promise<string>;
    }
  | {
      name: string;
      onClick: () => Promise<void>;
    };

interface Props {
  address: string | null;
  connectedMethods: ConnectedMethods[];
  handleConnect: () => Promise<void>;
  provider: IBTCProvider;
  logs: TLog[];
  clearLogs: () => void;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * @DEVELOPERS
 * The fun stuff!
 */
const useProps = (): Props => {
  const [provider, setProvider] = useState<IBTCProvider | null>(null);
  const [account, setAccount] = useState<{ address: string; publicKey: string } | null>(null);
  const [logs, setLogs] = useState<TLog[]>([]);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [setLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  useEffect(() => {
    (async () => {
      // sleep for 100 ms to give time to inject
      await sleep(100);
      setProvider(getProvider());
    })();
  }, []);

  useEffect(() => {
    if (!provider) return;

    provider.on('accountsChanged', (changedAccounts: [] | [{ address: string; publicKey: string }]) => {
      if (changedAccounts.length === 1) {
        createLog({
          status: 'info',
          method: 'accountChanged',
          message: `Switched to account: ${JSON.stringify(changedAccounts[0])}`,
        });
      } else {
        /**
         * In this case dApps could...
         *
         * 1. Not do anything
         * 2. Only re-connect to the new account if it is trusted
         * 3. Always attempt to reconnect
         */

        createLog({
          status: 'info',
          method: 'accountChanged',
          message: 'Attempting to switch accounts.',
        });

        provider.requestAccounts().catch((error) => {
          createLog({
            status: 'error',
            method: 'accountChanged',
            message: `Failed to re-connect: ${error.message}`,
          });
        });
      }
    });
  }, [provider, createLog]);

  /** Sign a PSBT */
  const handleBtcSignTransaction = useCallback(async () => {
    if (!provider) return;

    try {
      // send the transaction up to the network
      const transaction = await signTransaction(provider);

      createLog({
        status: 'success',
        method: 'btc_signPSBT',
        message: `Signed PSBT: ${transaction}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'btc_signPSBT',
        message: error.message,
      });
    }
  }, [provider, createLog]);

  /** Connect */
  const handleConnect = useCallback(async () => {
    if (!provider) return;

    try {
      const accounts = await provider.requestAccounts();
      createLog({
        status: 'success',
        method: 'btc_requestAccounts',
        message: `connected to account: ${JSON.stringify(accounts[0])}`,
      });
      if (accounts.length === 1) setAccount(accounts[0]);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'btc_requestAccounts',
        message: error.message,
      });
    }
  }, [provider, createLog]);

  const connectedMethods = useMemo(() => {
    return [
      {
        name: 'Sign Transaction',
        onClick: handleBtcSignTransaction,
      },
    ];
  }, [handleBtcSignTransaction]);

  return {
    address: account?.address,
    connectedMethods,
    handleConnect,
    provider,
    logs,
    clearLogs,
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const { address, connectedMethods, handleConnect, logs, clearLogs } = props;

  return (
    <StyledApp>
      <Sidebar address={address} connectedMethods={connectedMethods} connect={handleConnect} />
      <Logs address={address} logs={logs} clearLogs={clearLogs} />
    </StyledApp>
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const props = useProps();

  if (!props.provider) {
    return <NoProvider />;
  }

  return <StatelessApp {...props} />;
};

export default App;
