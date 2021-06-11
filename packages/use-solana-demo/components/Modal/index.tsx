import "@reach/dialog/styles.css";

import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { DialogContent, DialogOverlay } from "@reach/dialog";
import React from "react";
import { isMobile } from "react-device-detect";
import { animated, useSpring, useTransition } from "react-spring";
import { useGesture } from "react-use-gesture";

export interface IProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onDismiss: () => void;
  darkenOverlay?: boolean;
  topMargin?: number;
}

export const Modal: React.FC<IProps> = ({
  title,
  children,
  isOpen,
  onDismiss,
  darkenOverlay = true,
  topMargin,
}: IProps) => {
  const fadeTransition = useTransition(isOpen, {
    config: { duration: 150 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  const [{ y }, set] = useSpring(() => ({
    y: 0,
    config: { mass: 1, tension: 210, friction: 20 },
  }));
  const bind = useGesture({
    onDrag: (state) => {
      set({
        y: state.down ? state.movement[1] : 0,
      });
      if (
        state.movement[1] > 300 ||
        (state.velocity > 3 && state.direction[1] > 0)
      ) {
        onDismiss();
      }
    },
  });

  return (
    <>
      {fadeTransition(
        (props, item) =>
          item && (
            <StyledDialogOverlay
              style={props}
              isOpen={isOpen || props.opacity.get() !== 0}
              onDismiss={onDismiss}
              darkenOverlay={darkenOverlay}
              dangerouslyBypassScrollLock={topMargin !== undefined}
            >
              <ModalWrapper
                topMargin={topMargin}
                aria-label="dialog content"
                {...(isMobile
                  ? {
                      ...bind(),
                      style: {
                        transform: y.to(
                          (n) => `translateY(${n > 0 ? n : 0}px)`
                        ),
                      },
                    }
                  : {})}
              >
                <ModalHeader>
                  <Title>{title}</Title>
                  <CloseArea>
                    <Close
                      href="#"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDismiss();
                      }}
                    >
                      Close
                    </Close>
                    <KeyPill
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDismiss();
                      }}
                    >
                      esc
                    </KeyPill>
                  </CloseArea>
                </ModalHeader>
                {children}
              </ModalWrapper>
            </StyledDialogOverlay>
          )
      )}
    </>
  );
};

const KeyPill = styled.a`
  cursor: pointer;
  height: 20px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.base.tertiary};
  color: ${({ theme }) => theme.colors.text.bold};
  &:hover {
    color: ${({ theme }) => theme.colors.text.bold};
    background: ${({ theme }) => theme.colors.divider.primary};
  }
  border-radius: 4px;
  transition: 0.1s ease;
`;

const Close = styled.a`
  color: ${({ theme }) => theme.colors.text.muted};
  &:hover {
    color: ${({ theme }) => theme.colors.text.bold};
  }
  transition: 0.1s ease;
`;

const CloseArea = styled.div`
  display: flex;
  gap: 12px;
`;

const Title = styled.h2`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.text.default};
  margin: 0;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  padding-bottom: 24px;
  margin-bottom: 36px;
`;

const ModalWrapper = styled(animated(DialogContent))<{ topMargin?: number }>`
  box-shadow: ${({ theme }) => theme.modalshadow};
  width: 100%;
  max-width: 480px;
  padding: 24px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.modal.base.default};
  ${({ topMargin }) =>
    topMargin !== undefined &&
    css`
      margin-top: ${topMargin}px;
    `}
`;

const StyledDialogOverlay = styled(animated(DialogOverlay))<{
  darkenOverlay: boolean;
}>`
  &[data-reach-dialog-overlay] {
    z-index: 2;
    ${({ dangerouslyBypassScrollLock }) =>
      // this means that the modal is acting like a dropdown
      dangerouslyBypassScrollLock === true &&
      css`
        position: absolute;
        overflow: unset;
      `}
  }
  ${({ darkenOverlay }) =>
    darkenOverlay
      ? css`
          background: rgba(0, 0, 0, 0.55);
        `
      : css`
          background: none;
        `}
`;
