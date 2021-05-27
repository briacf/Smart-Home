$('a').on('click', function (e) {
    e.stopPropagation();
});

$('.circle').on('click', function (e) {
    e.stopPropagation();
});

$('.slidecontainer').on('click', function (e) {
    e.stopPropagation();
});

$('.expandable').click(function () {
    var id = this.id;
    var container = document.getElementById(this.id);
    console.log(container);

    if (container.classList.contains("info-container")) {
        container.classList.toggle('expand');
    }
    
    if (container.classList.contains("rule-box")) {
        container.classList.toggle('expand');
        if (id.includes("-schedulerule")) {         
            var typedevice = this.id.split("-")[0];
            var typetoggle = typedevice + "-toggle";
            var toggle = document.getElementById(typetoggle);
            toggle.classList.toggle("toggle_expand");
        }
    }

    var rule = container.querySelector(".sched");
    if (rule !== null) {
        rule.classList.toggle('show');
    }  


    if (id.includes("-container")) {
        const device_container = document.getElementById(this.id);
        device_container.classList.toggle('expand');
        
        var typedevice = this.id.split("-")[0];
        var typetoggle = typedevice + "-switch-box";
        var toggle = document.getElementById(typetoggle);
        toggle.classList.toggle("toggle_expand");
    }

    var device_container = document.getElementById(this.id);
    var device = device_container.querySelector(".bulb");
    if (device !== null) {
        device.classList.toggle('show');
    }   
});
