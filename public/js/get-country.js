$.getJSON('https://api.ipify.org?format=json', function(data){
    var ip = data.ip;
    $.get('https://ipapi.co/'+ip+'/latlong/', function(result){
        var latitudelong = result.split(',');
        $.get('https://api.openweathermap.org/data/2.5/weather?lat=' + latitudelong[0] + '&lon=' + latitudelong[1] + '&appid=3bfeab8206e2e50eae350034e8141526', function(datares) {
            var city = datares.name;
            var country = datares.sys.country;

            document.getElementById("location").innerHTML = city + ", " + country;
        });
    });
});