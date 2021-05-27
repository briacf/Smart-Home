function getDeviceTime(model) {
    $.ajax({
        type: 'POST',
        url: domain + '/command',
        data: { model: model, command: "time"},
        success: function (res) {
            console.log(res);
        }
    });
}