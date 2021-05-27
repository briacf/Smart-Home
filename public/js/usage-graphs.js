var domain = 'https://deco3801-non-pc.uqcloud.net';

const oemID = document.getElementById('device-oem-id').value;

function setGraph(kind) {
    document.getElementById('todayTab').classList.remove('active');
    document.getElementById('weekTab').classList.remove('active');
    document.getElementById(kind + 'Tab').classList.add('active');

    var title = '';

    if (kind == "today") {
        title = "Today";
    } else if (kind == "week") {
        title = "This Week";
    }

    $.ajax({
        type: 'POST',
        url: domain + '/usage/graph',
        data: { deviceID: oemID, kind: kind },
        success: function (res) {
            generateGraph(res[0], title, res[1], res[2]);
        },
    });
}

window.onload = function () {
    $.ajax({
        type: 'POST',
        url: domain + '/usage/graph',
        data: { deviceID: oemID, kind: 'today' },
        success: function (res) {
            generateGraph(res[0], "Today", res[1], res[2]);
        },
    });
};

function generateGraph(xLabels, xTitle, powerUsage, powerGoals) {
    powerGoals.push(0);
    var ctx = document.getElementById('usageGraph').getContext('2d');

    var barFill = ctx.createLinearGradient(0, 700, 0, 100);
    barFill.addColorStop(0, "rgba(70,159,225,0.6)");
    barFill.addColorStop(1, "rgba(70,159,225,0.6)");

    var barFill2 = ctx.createLinearGradient(0, 700, 0, 100);
    barFill2.addColorStop(0, "rgba(70,179,88,0.6)");
    barFill2.addColorStop(1, "rgba(70,179,88,0.6)");

    Chart.defaults.global.defaultFontSize = '30';
    var config = {
        type: 'bar',
        data: {
            labels: xLabels,
            datasets: [{
                backgroundColor: barFill,
                data: powerUsage,
                borderWidth: '0',
            }, {
                backgroundColor: barFill2,
                data: powerGoals,
                borderWidth: '0',
            }]
        },
        options: {
            legend: {
                display: false
            },
            responsive: true,
            title: {
                display: false,
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    },
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: xTitle,
                        fontSize: '40'
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display: false
                    },
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'kW',
                        fontSize: '40'
                    }
                }]
            }
        }
    };

    new Chart(ctx, config);
}