/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_RPC_URL?: string;
  readonly VITE_PROGRAM_ID?: string;
  readonly VITE_STREAMER_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
