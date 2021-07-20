import styled from "@emotion/styled";
import {
  useSolana,
  WALLET_PROVIDERS,
  WalletProviderInfo,
  WalletType,
} from "@saberhq/use-solana";
import React from "react";
import { isMobile } from "react-device-detect";

import { IProps as IModalProps, Modal } from "./Modal";

type IProps = Omit<IModalProps, "children" | "title">;

export const WalletSelectorModal: React.FC<IProps> = ({
  ...modalProps
}: IProps) => {
  const { activate } = useSolana();
  const sortedWalletProviders: readonly [WalletType, WalletProviderInfo][] = (
    Object.entries(WALLET_PROVIDERS) as readonly [
      WalletType,
      WalletProviderInfo
    ][]
  )
    .filter(([, p]) => (isMobile ? p.isMobile : true))
    .slice()
    .sort(([, a], [, b]) =>
      (a.isInstalled?.() ?? true) === (b.isInstalled?.() ?? true)
        ? a.name < b.name
          ? -1
          : 1
        : a.isInstalled?.() ?? true
        ? -1
        : 1
    );

  return (
    <Modal title="Connect your wallet" {...modalProps}>
      <Wallets>
        {sortedWalletProviders.map(([walletType, provider]) => {
          const mustInstall = provider.isInstalled?.() === false;
          const icon =
            typeof provider.icon === "string" ? (
              <img src={provider.icon} />
            ) : (
              <provider.icon />
            );
          return (
            <WalletProvider
              key={provider.url}
              role="button"
              onClick={async () => {
                if (mustInstall) {
                  window.open(provider.url, "_blank", "noopener noreferrer");
                  return;
                }
                await activate(walletType);
                modalProps.onDismiss();
              }}
            >
              {icon}
              <span>
                {mustInstall ? `Install ${provider.name}` : provider.name}
              </span>
            </WalletProvider>
          );
        })}
      </Wallets>
    </Modal>
  );
};

const Wallets = styled.div`
  display: grid;
  grid-auto-flow: row;
  grid-row-gap: 4px;
`;

const WalletProvider = styled.div`
  padding: 12px;
  display: grid;
  grid-template-columns: 12px 1fr;
  grid-column-gap: 12px;
  align-items: center;
  border-radius: 8px;

  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.modal.item.base.hover};
    color: ${({ theme }) => theme.colors.text.bold};
  }

  & > img,
  & > svg {
    height: 12px;
    width: 12px;
  }
`;
