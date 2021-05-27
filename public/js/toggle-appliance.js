//Domain for Ajax
var domain = 'https://deco3801-non-pc.uqcloud.net';
var url = window.location.href.split("/");
var page = url[url.length - 1];

if (page == "login" || page == "details") {
    document.body.style.backgroundColor = "#3b3b3b";
    document.body.style.color = "white";
}

$.getJSON('https://api.ipify.org?format=json', function(data){
    var ip = data.ip;
    $.get('https://ipapi.co/'+ip+'/latlong/', function(result){
        var latitudelong = result.split(',');
        $.get('https://api.openweathermap.org/data/2.5/weather?lat=' + latitudelong[0] + '&lon=' + latitudelong[1] + '&appid=3bfeab8206e2e50eae350034e8141526', function(datares) {
            var weather = datares.main.temp - 273.15;
            var humidity = datares.main.humidity;
            
            if (document.getElementById("temp") != null && document.getElementById("humid") ) {
            document.getElementById("temp").innerHTML = Math.round(weather) + "°C";
            document.getElementById("humid").innerHTML = Math.round(humidity) + "%";
            }
        });
    });
});

function toggleAppliance(alias, model) {
    const box = document.getElementById(alias + '-switch-box');
    const boxSwitch = document.getElementById(alias + '-switch');

    if (boxSwitch.classList.contains("fa-toggle-off")) {
        boxSwitch.classList.remove('fa-toggle-off');
        boxSwitch.classList.add('fa-toggle-on');
        box.style.backgroundColor = "#a0dbbb";

        $.ajax({
            type: 'POST',
         url: domain + '/command',
            data: { alias: alias, model: model, command: "toggle" , state: 1},
            success: function (res) {
                console.log(res);
            }
        });
    } else if (boxSwitch.classList.contains("fa-toggle-on")) {
        boxSwitch.classList.remove('fa-toggle-on');
        boxSwitch.classList.add('fa-toggle-off');
        box.style.backgroundColor = "#dedede";
        $.ajax({
            type: 'POST',
            url: domain + '/command',
            data: { alias: alias, model: model, command: "toggle" , state: 0},
            success: function (res) {
                console.log(res);
            }
        });
    }
}

//https://www.briandorey.com/post/tp-link-lb130-smart-wi-fi-led-bulb-python-control