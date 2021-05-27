//Domain for Ajax
var domain = 'https://deco3801-non-pc.uqcloud.net';

function toggleRoomColor(color) {
    let otherColors = document.getElementsByClassName('circle')

    for (var i = 0; i < otherColors.length; i++) {
        otherColors[i].classList.remove('selected');
    }

    document.getElementsByClassName(color)[0].classList.add('selected');
    document.getElementById("roomColor").value = color;
}