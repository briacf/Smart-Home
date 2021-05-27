var domain = 'https://deco3801-non-pc.uqcloud.net';

window.onload = function () {
    $.ajax({
        type: 'POST',
        url: domain + '/usage/room-graph',
        success: function (res) {
            generatePieChart(res[0], res[1], res[2]);

            $.ajax({
                type: 'POST',
                url: domain + '/usage/graph',
                data: { deviceID: "all", kind: 'week' },
                success: function (res) {
                    generateLineGraph(res[0], "", res[1], res[2]);
                },
            });
        },
    });

    getLeastEfficientDevices();
};

function generateLineGraph(xLabels, xTitle, powerUsage, powerGoals) {
    Chart.defaults.global.defaultFontSize = '30';
    var lineConfig = {
        type: 'line',
        data: {
            labels: xLabels,
            datasets: [
                {
                    backgroundColor: "rgba(103,160,48,0.4)",
                    borderColor: "rgba(0,55,0,0.4)",
                    data: powerGoals,
                    fill: false,
                    borderWidth: '10',
                    pointRadius: '4'
                }, {
                    backgroundColor: "rgba(119,170,255,0.4)",
                    borderColor: "rgba(51,102,255,0.4)",
                    data: powerUsage,
                    fill: true,
                    borderWidth: '10',
                    pointRadius: '4'
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
            tooltips: { enabled: false },
            hover: { mode: null },
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

    var ctx = document.getElementById('usageGraph').getContext('2d');
    new Chart(ctx, lineConfig);
}

function generatePieChart(xLabels, data, colors) {
    console.log(data);
    const doughnutConfig = {
        type: 'doughnut',
        data: {
            labels: xLabels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                hoverOffset: 4
            }]
        },
        options: {
            legend: {
                display: false
            },
            tooltips: { enabled: false },
            hover: { mode: null },
        }
    };

    var ctx = document.getElementById('roomsGraph').getContext('2d');
    new Chart(ctx, doughnutConfig);

    var legend = document.getElementById('roomsGraphLegend');
    legend.innerHTML = '<div class="legend-color" style="background-color: ' + colors[0] + '"></div>' + xLabels[0];

    for (var i = 1; i < xLabels.length; i++) {
        legend.innerHTML = legend.innerHTML + '<div class="legend-color ml-3" style="background-color: ' + colors[i] + '"></div>' + xLabels[i];
    }
}

function getLeastEfficientDevices() {
    $.ajax({
        type: 'POST',
        url: domain + '/usage/least-efficient',
        success: function (res) {
            let devices = res.leDevices;
            let powerGoals = res.leGoals;
            let powerUsage = res.leUsage;

            if (devices.length != 0) {
                document.getElementById('no-devices-label').classList.add('hidden');

                for (var i = 0; i < devices.length; i++) {
                    document.getElementById('le-device-' + (i + 1) + '-box').classList.remove('hidden');
                    document.getElementById('le-device-' + (i + 1) + '-label').innerHTML = devices[i].alias;
                    document.getElementById('le-device-' + (i + 1) + '-link').href = domain + '/usage/rewards/' + devices[i].oem_id;

                    generateHorizontalChart('le-device-' + (i + 1) + '-graph', [powerUsage[i], powerGoals[i]]);
                }
            }
        },
    });
}

function generateHorizontalChart(id, data) {
    Chart.defaults.global.defaultFontSize = '40';

    var ctx = document.getElementById(id).getContext("2d");
    
    var barFill = ["rgba(70,159,225,0.6)", "rgba(70,179,88,0.6)"]

    var myChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: ["Usage", "Goal"],
            datasets: [{
                label: "Data",
                borderWidth: 1,
                fill: true,
                backgroundColor: barFill,
                data: data
            },]
        },
        options: {
            animation: {
                easing: "easeOutQuart"
            },
            legend: {
                position: "bottom",
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        padding: 15,
                        fontColor: "#000",
                        beginAtZero: true,
                        //display: false - remove this and commenting to display: false
                    },
                    gridLines: {
                        drawTicks: false,
                        display: false,
                        color: "transparent",
                        zeroLineColor: "transparent"
                    }
                }],
                xAxes: [{
                    display: false,
                    gridLines: {
                        display: false,
                        color: "transparent",
                        zeroLineColor: "transparent"
                    },
                    ticks: {
                        padding: 15,
                        beginAtZero: true,
                        fontColor: "#000",
                        maxTicksLimit: 20,
                        //display: false - remove this and commenting to display: false
                    }
                }]
            }
        }
    });
}