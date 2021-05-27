//Domain for Ajax
var domain = 'https://deco3801-non-pc.uqcloud.net';

function toggleColor(alias, model, color) {
    const otherColors = document.getElementById(alias + '-container').getElementsByClassName('selected')[0].classList.remove('selected');;

    const selectedColor = document.getElementById(alias + '-color-' + color);
    selectedColor.classList.add('selected');
    var hue;
    var saturation;
    var color_temp;
    
    switch(color) {
        case "off-white":
            hue = 0;
            saturation = 0;
            color_temp = 2700;
            break;
        case "white":
            hue = 0;
            saturation = 0;
            color_temp = 4800;
            break;
        case "green":
            hue = 120;
            saturation = 75;
            color_temp = 0;
            break;
        case "red":
            hue = 0;
            saturation = 75;
            color_temp = 0;
            break;
        case "blue":
            hue = 215;
            saturation = 70;
            color_temp = 0;
            break;
        }
    $.ajax({
        type: 'POST',
        url: domain + '/command',
        data: { alias: alias, model: model, command: "transition", color: color, hue: hue,
                saturation: saturation, color_temp: color_temp},
        success: function (res) {
            console.log(res);
        }
    });
}