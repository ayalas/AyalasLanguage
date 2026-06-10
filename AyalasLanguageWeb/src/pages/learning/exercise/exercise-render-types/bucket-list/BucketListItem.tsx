import React from 'react';

type Props = {
  itemValue: string;
  position: number;
  itemClicked: (val: string, pos: number) => void;
};

export const BucketListItem: React.FC<Props> = ({ itemValue, position, itemClicked }) => {
  function clickButton(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    itemClicked(itemValue, position);
  }

  return (
    <div className="bucket-list-item-cell">
      <button data-testid="click-button" className="bucket-list-item-button" onClick={clickButton}>{itemValue}</button>
    </div>
  );
};

export default BucketListItem;
