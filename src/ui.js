
// Define UI elements
let ui = {
    timer: document.getElementById('timer'),
    robotState: document.getElementById('robot-state').firstChild,
    autoSelect: document.getElementById('auto-select'),
    autoConfirm: document.getElementById('auto-readout'),
    camera: document.getElementById('camera')
};
NetworkTables.putValue("/SmartDashboard/test", true);
//Timer
NetworkTables.addKeyListener('/robot/time', (key, value) => {
    // This is an example of how a dashboard could display the remaining time in a match.
    // We assume here that value is an integer representing the number of seconds left.
    ui.timer.innerHTML = value < 0 ? '0:00' : Math.floor(value / 60) + ':' + (value % 60 < 10 ? '0' : '') + value % 60;
});

//Camera stream updates
NetworkTables.addKeyListener('/SmartDashboard/StreamURL', (key, value) => {
    ui.camera.style.backgroundImage = `url('${value}'), url('../images/stream_not_found.png')`
});


// Key Listeners
// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/AutoModes', (key, value) => {
    // Clear previous list
    while (ui.autoSelect.firstChild) {
        ui.autoSelect.removeChild(ui.autoSelect.firstChild);
    }
    console.log(value.length);
    // Make an option for each autonomous mode and put it in the selector
    if(value.length < 1) value[0] = "No auto modes found";
    value.forEach((mode) => {
        var option = document.createElement('option');
        option.appendChild(document.createTextNode(mode));
        ui.autoSelect.appendChild(option);
    });
    // Set value to the already-selected mode. If there is none, nothing will happen.
    ui.autoSelect.value = NetworkTables.getValue('/SmartDashboard/SelectedAuto');
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/SelectedAuto', (key, value) => {
    ui.autoConfirm.value = value;
    ui.autoSelect.value = value;
    if(ui.autoSelect.value == value) {
        ui.autoConfirm.style.backgroundColor = 'green';
    } else {
        ui.autoConfirm.style.backgroundColor = 'red';
    }
});
// Update NetworkTables when autonomous selector is changed
ui.autoSelect.onchange = function() {
    NetworkTables.putValue('/SmartDashboard/SelectedAuto', this.value);
};

addEventListener('error',(ev)=>{
    ipc.send('windowError',{mesg:ev.message,file:ev.filename,lineNumber:ev.lineno})
});