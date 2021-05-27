var selected = false;
var currentAlias = '';
var modal = document.getElementById("myModal");

function setAlias(alias) {
    modal.style.display = "block";
    currentAlias = alias;
}


var totalDevices = 0;
var numberSet = 0;

window.onload = function () {
    totalDevices = document.getElementById("numberDevices").value;
};



async function selectType(type) {
    if (!selected) {
        var typeBox = document.getElementById(type + '-box');
        var typeCheck = document.getElementById(type + '-check');
        var typeValue = document.getElementById(type + '-value');

        typeBox.classList.add('selected');
        typeCheck.classList.add('selected');
        typeValue.value = 'true';

        await new Promise(r => setTimeout(r, 500));

        modal.style.display = "none";

        var typeName = type;

        if (typeName == 'tv') {
            typeName = 'TV';
        } else if (typeName == 'small-appliance') {
            typeName = 'Small Appliance';
        } else {
            typeName = type.charAt(0).toUpperCase() + type.slice(1);
        }

        type = type.replace(" ", "-");

        document.getElementById(currentAlias + '-type').innerHTML = typeName;
        document.getElementById(currentAlias + '-img').src = '/img/icons/devices/' + type + '.png';
        document.getElementById(currentAlias + '-img').classList.add('type-icon');
        document.getElementById(currentAlias + '-value').value = type;

        typeBox.classList.remove('selected');
        typeCheck.classList.remove('selected');

        numberSet += 1;

        if (numberSet == totalDevices) {
            document.getElementById("submit-btn").disabled = false;
        }
    }
}