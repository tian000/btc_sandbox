import EventEmitter from 'eventemitter3';

type PhantomRequestMethod = 'btc_requestAccounts' | 'btc_getAccounts' | 'btc_signPSBT';

export type Status = 'success' | 'warning' | 'error' | 'info';

export interface TLog {
  status: Status;
  method?: PhantomRequestMethod | 'accountChanged';
  message: string;
  messageTwo?: string;
}

export declare type Listener = (...args: any[]) => Promise<any> | void;
export declare type DefaultEventMap = {
  [event in string | symbol]: Listener;
};

export interface IBTCProvider
  extends EventEmitter<{
    // Emitted on connect, accounts changing, and disconnect
    accountsChanged: [[] | [{ address: string; publicKey: string }]];
    // Emitted when changing between bitcoin testnets and mainnets
    chainChanged: string;
  }> {
  // Asks the user for access to the public key of the currently selected wallet
  requestAccounts(): Promise<[{ address: string; publicKey: string }]>;
  // Silently retrieves the public key if it is available
  getAccounts(): Promise<[{ address: string; publicKey: string }]>;
  // Signs a PSBT encoded as HEX
  // PSBTs are finalized by default after we sign, i.e. autoFinalize defaults to true.
  signPSBT(psbtHex: string, options: { autoFinalize: boolean }): Promise<string>;
}
