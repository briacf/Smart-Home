function expandRewards(container) {
    var box = document.getElementById(container + '-box');
    var icon = document.getElementById(container + '-icon');
    
    if (icon.classList.contains('fa-plus')) {
        box.classList.remove('minimized');
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
    } else {
        box.classList.add('minimized');
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
    }
}