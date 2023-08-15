import { IBTCProvider } from '../types';
/**
 * Retrieves the Phantom Provider from the window object
 * @returns {Web3Provider | void} a Phantom provider if one exists in the window
 */
const getProvider = (): IBTCProvider | undefined => {
  if ('phantom' in window) {
    const anyWindow: any = window;
    const btc = anyWindow?.phantom?.bitcoin;
    return btc;
  }

  window.open('https://phantom.app/', '_blank');
};

export default getProvider;
