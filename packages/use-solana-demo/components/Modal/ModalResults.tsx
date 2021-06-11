import { css } from "@emotion/react";
import styled from "@emotion/styled";
import React, { useState } from "react";

interface IProps {
  search?: {
    placeholder?: string;
  };
  results: readonly {
    key: string;
    onClick?: () => void;
    content: React.ReactNode;
    selected?: boolean;
  }[];
}

export const ModalResults: React.FC<IProps> = ({ results, search }: IProps) => {
  const [query, setQuery] = useState<string>("");
  return (
    <>
      {search && (
        <SearchInput
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder={search.placeholder}
        />
      )}
      <Results>
        {results.map(({ key, onClick, content, selected }) => (
          <ResultItem key={key} onClick={onClick} selected={selected}>
            {content}
          </ResultItem>
        ))}
      </Results>
    </>
  );
};

const SearchInput = styled.input`
  caret-color: ${({ theme }) => theme.colors.text.accent};
  color: ${({ theme }) => theme.colors.text.bold};
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  outline: none;
  background: none;
  border: none;
  font-size: 20px;
  line-height: 16px;
`;

const ResultItem = styled.div<{ selected?: boolean }>`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  padding: 0 12px;
  &:hover {
    background: ${({ theme }) => theme.colors.modal.item.base.hover};
    color: ${({ theme }) => theme.colors.text.bold};
  }
  ${({ selected, theme }) =>
    selected &&
    css`
      color: ${theme.colors.text.bold};
    `}
  transition: all 0.1s ease;
`;

const Results = styled.div`
  margin-top: 36px;
  display: grid;
  gap: 4px;
`;
