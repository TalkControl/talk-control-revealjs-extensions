export function transformListFragment() {
    const listItemWithFragments = [
        ...document.querySelectorAll('.reveal .slides section .list-fragment'),
    ];
    for (const lisItemWithFragmentTag of listItemWithFragments) {
        let parentOfListItem = lisItemWithFragmentTag.parentElement; // Ul or OL
        if (parentOfListItem?.nodeName === 'LI') {
            // Specific case when you have some markdown bold or italic
            parentOfListItem = parentOfListItem.parentElement;
        }
        if (
            parentOfListItem?.nodeName === 'UL' ||
            parentOfListItem?.nodeName === 'OL'
        ) {
            const listItemsOfParent = [
                ...parentOfListItem.querySelectorAll('li'),
            ];
            for (const listItem of listItemsOfParent) {
                listItem.classList.add('fragment');
            }
        }
    }
}
