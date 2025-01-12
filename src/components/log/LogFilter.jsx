import React from 'react';
import styled from 'styled-components';

const FilterContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const CheckboxContainer = styled.div`
  position: relative;
  width: 16px;
  height: 16px;
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const StyledCheckbox = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  background: transparent;
  border: 2px solid var(--terminal-green);
  transition: all 0.2s;

  ${HiddenCheckbox}:checked + & {
    background: var(--terminal-green);
    &:after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid var(--terminal-bg);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 5px var(--terminal-green);
  }
`;

const FilterLabel = styled.span`
  user-select: none;
`;

const filters = [
  { id: 'vote', label: 'Vote' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'new', label: 'Fetch' },
  { id: 'news', label: 'News' }
];

export default function LogFilter({ filters: activeFilters, onChange }) {
  return (
    <FilterContainer>
      {filters.map(({ id, label }) => (
        <FilterOption key={id}>
          <CheckboxContainer>
            <HiddenCheckbox
              type="checkbox"
              checked={activeFilters[id]}
              onChange={(e) => onChange(id, e.target.checked)}
            />
            <StyledCheckbox />
          </CheckboxContainer>
          <FilterLabel>{label}</FilterLabel>
        </FilterOption>
      ))}
    </FilterContainer>
  );
}