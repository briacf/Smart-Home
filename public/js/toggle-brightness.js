function toggleBrightness(alias, model, brightness) {
    $.ajax({
        type: 'POST',
        url: domain + '/command',
        data: { alias: alias, model: model, command: "brightness" , brightness: brightness},
        success: function (res) {
            console.log(res);
        }
    });
}