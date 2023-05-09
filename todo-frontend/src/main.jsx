
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  configureChains,
  createClient,
  WagmiConfig,
} from 'wagmi';
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';

import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

const ethermint = {
  id: 9000,
  name: 'Ethermint',
  network: 'ethermint',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethermint',
    symbol: 'CTE',
  },
  rpcUrls: {
    default: {
      http: [`${process.env.REACT_APP_CONTRACT_ADDRESS}`],
    },
  },

  testnet: true,
};

const { chains, provider } = configureChains(
  [ethermint],
  [
    jsonRpcProvider({
      rpc: chain => ({ http: chain.rpcUrls.default.http[0] }),
    }),
  ]
);

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      metaMaskWallet({ chains }),
      injectedWallet({ chains }),
    ],
  },
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <WagmiConfig client={wagmiClient} >
    <RainbowKitProvider chains={chains}>
      <div  >
        <App />
      </div>
    </RainbowKitProvider>
  </WagmiConfig>
)