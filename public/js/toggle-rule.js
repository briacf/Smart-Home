//Domain for Ajax
var domain = 'hhttps://deco3801-non-pc.uqcloud.net';
var url = window.location.href.split("/");
var page = url[url.length - 1];

function toggleRule(alias, rule_id) {
    const box = document.getElementById(alias + '-' + rule_id +'-toggle');
    const boxSwitch = document.getElementById(alias  + '-' + rule_id + '-switch');

    if (boxSwitch.classList.contains("fa-toggle-off")) {
        boxSwitch.classList.remove('fa-toggle-off');
        boxSwitch.classList.add('fa-toggle-on');
        box.style.backgroundColor = "#a0dbbb";

    } else if (boxSwitch.classList.contains("fa-toggle-on")) {
        boxSwitch.classList.remove('fa-toggle-on');
        boxSwitch.classList.add('fa-toggle-off');
        box.style.backgroundColor = "#dedede";
    }
}

function toggleRuleDays(alias, rule_id, day) {
    console.log(alias + '-' + rule_id + '-day-' + day);
    const box = document.getElementById(alias + '-' + rule_id + '-day-' + day);

    if (box.classList.contains("checkedday")) {
        box.classList.remove('checkedday');

    } else {
        box.classList.add('checkedday');
    }
}

//https://www.briandorey.com/post/tp-link-lb130-smart-wi-fi-led-bulb-python-control