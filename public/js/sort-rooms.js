function sortRooms(kind) {
    document.getElementById('devicesTab').classList.remove('active');
    document.getElementById('dateTab').classList.remove('active');

    document.getElementById(kind + 'Tab').classList.add('active');
}