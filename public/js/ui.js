var url = window.location.href.split("/");
var page = url[url.length - 1];

switch(page) {
    case "":
        document.getElementById("navbarhome").getElementsByTagName('a')[0].style.cssText = "color: #b33620 !important";
        break;      
    case "rooms":
        document.getElementById("navbarrooms").getElementsByTagName('a')[0].style.cssText = "color: #b33620 !important";
        break;   
    case "rewards":
        document.getElementById("navbarrewards").getElementsByTagName('a')[0].style.cssText = "color: #b33620 !important";
        break; 
    case "leesave":
        document.getElementById("navbarleesave").getElementsByTagName('a')[0].style.cssText = "color: #b33620 !important";
        break; 
    case "leesave_history":
        document.getElementById("navbarleesave").getElementsByTagName('a')[0].style.cssText = "color: #b33620 !important";
        break; 
}