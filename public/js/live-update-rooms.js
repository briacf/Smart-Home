var domain = 'https://deco3801-non-pc.uqcloud.net';

function liveUpdateRooms() {
    $.ajax({
        type: 'POST',
        url: domain + '/usage/update-rooms',
        success: function (res) {
            let spinners = document.getElementsByClassName('room-spinner')

            for (var i = 0; i < spinners.length; i++) {
                spinners[i].classList.add('hidden');
            }

            for (var i = 0; i < res.length; i++) {
                let roomName = res[i].replace("'", "").replace(" ", "");
                let power = res[i + 1];

                $('#' + roomName + '-power-label-room').text(power + ' Wh');

                i += 1;
            }

            let labels = document.getElementsByClassName('room-power')
            
            for (var i = 0; i < labels.length; i++) {
                labels[i].classList.remove('hidden');
            }
        }
    });

    setTimeout(function() {
        liveUpdateRooms();
    }, 10000);
}

liveUpdateRooms();