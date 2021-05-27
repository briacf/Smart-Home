var domain = 'https://deco3801-non-pc.uqcloud.net';

function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
}

async function liveUpdate() {
    $.ajax({
        type: 'POST',
        url: domain + '/usage/update',
        success: function (res) {
            let spinners = document.getElementsByClassName('product-spinner')

            for (var i = 0; i < spinners.length; i++) {
                spinners[i].classList.add('hidden');
            }

            for (var i = 0; i < res[0].length; i++) {
                if (res[i][0] == -1) {
                    $('#power-label-' + i).text("Offline");
                } else {
                    $('#power-label-' + i).text(res[0][i] + " Wh");
                }
                

                if (res[1][i] >= 0) {
                    $('#power-live-label-' + i).text(res[1][i] + " W live");
                }
            }

            let powerLabels = document.getElementsByClassName('device-power')
            let powerLiveLabels = document.getElementsByClassName('device-power-live')

            for (var i = 0; i < powerLabels.length; i++) {
                powerLabels[i].classList.remove('hidden');
                if (powerLiveLabels[i] != null) {
                    powerLiveLabels[i].classList.remove('hidden');
                }
            }

            $('#daily-power-label').text(res[2] + ' Wh');
            $('#goal-power-label').text(res[6] + ' Wh');

            // Find what percent of daily goal used so far
            var percent = percentage(res[2], res[6]);
            percent = Math.round(percent * 10 / 10);

            if (isNaN(percent)) {
                percent = 0;
            }

            if (document.getElementById('powerusagemain') != null) {
                if (percent >= 100) {
                    percent = 100;
                    document.getElementById('daily-power-percent-label').classList.add('move-left');
                }

                else {
                    document.getElementById('daily-power-percent-label').classList.remove('move-left');
                }
            }

            $('#daily-power-percent-label').text(percent + '%');
            $('#daily-power-percent-bar').css("width", percent + "%");

            $('#1-day-ago-label').text(res[5] + ' W');
            $('#2-day-ago-label').text(res[4] + ' W');
            $('#3-day-ago-label').text(res[3] + ' W');
        }
    });

    setTimeout(function () {
        liveUpdate();
    }, 10000);
}

liveUpdate();
