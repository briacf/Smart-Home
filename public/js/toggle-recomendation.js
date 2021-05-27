function toggleRecommendention(rule, model) {
    const box = document.getElementById(alias + '-switch-box');
    const boxSwitch = document.getElementById(alias + '-switch');

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