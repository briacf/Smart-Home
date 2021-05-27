function selectRoom(alias) {
    var roomBox = document.getElementById(alias + '-box');
    var roomCheck = document.getElementById(alias + '-check');
    var roomValue = document.getElementById(alias + '-value');

    if (roomBox.classList.contains("selected")) {
        roomBox.classList.remove('selected');
        roomCheck.classList.remove('selected');
        roomValue.value = 'false';
    } else {
        roomBox.classList.add('selected');
        roomCheck.classList.add('selected');
        roomValue.value = 'true';
    }
}