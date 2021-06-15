import { Network } from "@saberhq/solana";
import { notification } from "antd";
import { ArgsProps, NotificationInstance } from "antd/lib/notification";
import React from "react";
import { isMobile } from "react-device-detect";

interface INotifyArgs {
  message?: string;
  description?: React.ReactNode;
  txid?: string;
  network?: Network;
  type?: keyof NotificationInstance;
  placement?: ArgsProps["placement"];
}

export function notify({
  message = "",
  description,
  txid = "",
  network,
  type = "info",
  placement = "bottomLeft",
}: INotifyArgs): void {
  console.log(`${message || "Transaction"} broadcasted: ${txid}`);
  if (txid) {
    description = (
      <div>
        View Transaction:{" "}
        <a
          href={`https://explorer.solana.com/tx/${txid}?cluster=${
            network?.toString() ?? ""
          }`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {txid.slice(0, 8)}...{txid.slice(txid.length - 8)}
        </a>
      </div>
    );
  }
  notification[type]({
    message,
    description,
    placement,
    style: {
      marginBottom: isMobile ? "80px" : undefined,
    },
    duration: 7,
  });
}
