export function BucketListItem({ itemValue, position, itemClicked }) {

    function clickButton(e) {
        e.preventDefault();
        
        itemClicked(itemValue, position);
    }

     return (
        <div className="bucket-list-item-cell">
            <button className="bucket-list-item-button"
            onClick={clickButton}>{itemValue}</button>
        </div>
    );
}