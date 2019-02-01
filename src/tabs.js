function selectTab(tabButton) {
    Array.from(document.getElementsByClassName('tab-button')).forEach(button => {
        button.toggleAttribute('selected', false);
    });
    tabButton.toggleAttribute('selected', true);
    Array.from(document.getElementsByClassName('tab-content')).forEach(tabSpace => {
        tabSpace.toggleAttribute('selected', false)
    });
    var tabContent = document.getElementById(tabButton.id + '-content');
    tabContent.toggleAttribute('selected', true);
}

Array.from(document.getElementsByClassName('tab-button')).forEach(button => {
    button.onclick = () => selectTab(button);
});
document.getElementById('pre-match').click();


