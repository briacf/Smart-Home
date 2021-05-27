var domain = 'https://deco3801-non-pc.uqcloud.net';

function updateSetting(setting) {
    var settingSwitch = document.getElementById(setting + '-switch');

    if (settingSwitch.classList.contains("fa-toggle-on")) {
        settingSwitch.classList.remove('fa-toggle-on');
        settingSwitch.classList.add('fa-toggle-off');

        $.ajax({
            type: 'POST',
         url: domain + '/profile/update/settings',
            data: { setting: setting, state: 0},
            success: function (res) {
                console.log(res);
            }
        });
    } else {
        settingSwitch.classList.add('fa-toggle-on');

        $.ajax({
            type: 'POST',
         url: domain + '/profile/update/settings',
            data: { setting: setting, state: 1},
            success: function (res) {
                console.log(res);
            }
        });
    }
}