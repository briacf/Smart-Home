function showDevices() {
    var deviceToggle = document.getElementById('deviceToggle');
    var deviceView = document.getElementById('devices');
    
    if (deviceToggle.innerHTML == 'Hide') {
        deviceToggle.innerHTML = 'Show';
        deviceView.classList.add("hidden")
    } else {
        deviceToggle.innerHTML = 'Hide';
        deviceView.classList.remove("hidden")
    }
}