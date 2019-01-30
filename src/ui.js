const electron = require('electron').remote;
// Define UI elements
let ui = {
    timer: document.getElementById('timer'),
    robotState: {
        connectionPanel: document.getElementById('connection-panel'),
        connection: document.getElementById('connection-display').firstChild
    },
    autoSelect: document.getElementById('auto-select'),
    autoConfirm: document.getElementById('auto-readout'),
    camera: document.getElementById('camera'),
    cameraSelector: document.getElementById('camera-select'),
    matchInfo: {
        event: document.getElementById('mi-event-content'),
        match: {
            type: document.getElementById('mi-match-type-content'),
            number: document.getElementById('mi-match-number-content')
        }
    },
    batteryPanel: {
        panel: document.getElementById('battery-panel'),
        readout: document.getElementById('battery-readout'),
    },
};
ui.camera.setStreamURL = (url) => {
    ui.camera.style.backgroundImage = `url('${url}'), url('../images/stream_not_found.png')`
};
//Timer
NetworkTables.addKeyListener('/Robot/Time', (key, value) => {
    // This is an example of how a dashboard could display the remaining time in a match.
    // We assume here that value is an integer representing the number of seconds left.
    ui.timer.innerHTML = value < 0 ? '0:00' : Math.floor(value / 60) + ':' + (value % 60 < 10 ? '0' : '') + value % 60;
});

//Camera stream updates
NetworkTables.addKeyListener('/SmartDashboard/StreamURL', (key, value) => {
    ui.camera.setStreamURL(value);
});


// Key Listeners
// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/Auto List', (key, value) => {
    // Clear previous list
    while (ui.autoSelect.firstChild) {
        ui.autoSelect.removeChild(ui.autoSelect.firstChild);
    }
    console.log(value.length);
    // Make an option for each autonomous mode and put it in the selector
    if(value.length < 1) value[0] = "No auto modes found";
    value.forEach((mode) => {
        let option = document.createElement('option');
        option.appendChild(document.createTextNode(mode));
        ui.autoSelect.appendChild(option);
    });
    // Set value to the already-selected mode. If there is none, nothing will happen.
    ui.autoSelect.value = NetworkTables.getValue('/SmartDashboard/Selected Auto');
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/Selected Auto', (key, value) => {
    ui.autoConfirm.value = value;
    ui.autoSelect.value = value;
    if(ui.autoSelect.value == value) {
        ui.autoConfirm.style.backgroundColor = 'green';
    } else {
        ui.autoConfirm.style.backgroundColor = 'red';
    }
});

ui.autoSelect.addEventListener('change', (event) => {
    NetworkTables.putValue('/SmartDashboard/Selected Auto', event.target.value);
});

NetworkTables.addKeyListener('/FMSInfo/EventName', (key, value) => {
    ui.matchInfo.event.innerHTML = value;
});
NetworkTables.addKeyListener('/FMSInfo/MatchNumber', (key, value) => {
    ui.matchInfo.match.number.innerHTML = value;
});
NetworkTables.addKeyListener('/FMSInfo/MatchType', (key, value) => {
    let matchTypeString;
    switch(value) {
        case 1: matchTypeString = 'Practice'; break;
        case 2: matchTypeString = 'Qualification'; break;
        case 3: matchTypeString = 'Elimination'; break;
        default: matchTypeString = 'Unknown'; break;
    }
    ui.matchInfo.match.type.innerHTML = matchTypeString + " ";
});

NetworkTables.addKeyListener('/Robot/BatteryVoltage', (key, value) => {
    value = Number.parseFloat(value).toFixed(2);
    ui.batteryPanel.readout.innerHTML = value;
    let color;
    if(value < 7) color = 'red';
    else if(value < 10) color = 'yellow';
    else color = 'green';
    ui.batteryPanel.panel.style.color = color === 'yellow' ? 'black' : 'white';
    ui.batteryPanel.panel.style.backgroundColor = color;
});

/*NetworkTables.addKeyListener("/Robot/Mode", (key, value) => {
    let modeString;
    switch(value) {
        case 0: modeString = "Disabled"; break;
        case 1: modeString = "Teleop Enabled"; break;
        case 2: modeString = "Sandstorm Enabled"; break;
        case 3: modeString = "Test Mode"; break;
    }
    if(modeString && modeString.length !== 0) {
        ui.robotState.modeIndicator.innerHTML = modeString;
    }
});*/
addEventListener('error',(ev)=>{
    ipc.send('windowError',{mesg:ev.message,file:ev.filename,lineNumber:ev.lineno})
});

addEventListener('keydown', evt => {
    if(evt.key === 'w' && evt.ctrlKey) electron.getCurrentWindow().close();
});

NetworkTables.addGlobalListener((key, value, isNew) => {
    if (!key.startsWith('/CameraPublisher') || !isNew) return;
    let stream = key.split('/')[2];
    updateStream(getStream(stream));
    updateStreamList();
});
let streamList = new Map();
ui.cameraSelector.getSelectedStream = () => {
    return streamList.get(ui.cameraSelector.value);
};

ui.cameraSelector.addEventListener('change', () => {
    let streamUrl = ui.cameraSelector.getSelectedStream().streams[0];
    if(typeof streamUrl != 'undefined') {
        ui.camera.setStreamURL(streamUrl);
    }
});
let updateStream = (streamToUpdate) => {
    streamList.set(streamToUpdate.id, streamToUpdate);
};
let updateStreamList = () => {
    while(ui.cameraSelector.firstChild) ui.cameraSelector.removeChild(ui.cameraSelector.firstChild);
    streamList.forEach((stream, id) => {
        let option = document.createElement('option');
        option.text = id;
        ui.cameraSelector.add(option);
    })
};

let getStream = (id) => {
    return {
        id: id,
        //https://github.com/wpilibsuite/allwpilib/blob/master/cameraserver/src/main/java/edu/wpi/first/cameraserver/CameraServer.java#L303
        source: getStreamSubKey(id, 'source', ''),
        streams: getStreamSubKey(id, 'streams', []),
        description: getStreamSubKey(id, 'description', ''),
        connected: getStreamSubKey(id, 'connected', false),
        mode: getStreamSubKey(id, 'mode', ''),
        availableModes: getStreamSubKey(id, 'modes', [])
    };
};
let getStreamSubKey = (id, key, defaultVal) => {
    return NetworkTables.getValue(`/CameraPublisher/${id}/${key}`, defaultVal);
};
