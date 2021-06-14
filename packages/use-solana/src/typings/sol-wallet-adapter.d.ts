declare module "@project-serum/sol-wallet-adapter" {
  import EventEmitter from "eventemitter3";
  import { PublicKey, Transaction } from "@solana/web3.js";

  export default class Wallet<
    Connected extends boolean = boolean
  > extends EventEmitter {
    constructor(providerUrl: string, network: string);
    publicKey: Connected extends true ? PublicKey : null;
    connected: Connected;
    autoApprove: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (
      transactions: Transaction[]
    ) => Promise<Transaction[]>;
  }
}
