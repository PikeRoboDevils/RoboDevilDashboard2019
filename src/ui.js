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
    ui.camera.style.backgroundImage = `url(${url}), url('../images/stream_not_found.png')`
};
let streamList = new Map();
ui.cameraSelector.getSelectedStream = () => {
    return streamList.get(ui.cameraSelector.value);
};

//Timer
NetworkTables.addKeyListener('/Robot/Time', (key, value) => {
    // This is an example of how a dashboard could display the remaining time in a match.
    // We assume here that value is an integer representing the number of seconds left.
    ui.timer.innerHTML = value < 0 ? '0:00' : Math.floor(value / 60) + ':' + (value % 60 < 10 ? '0' : '') + value % 60;
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
    if (value.length < 1) value[0] = "No auto modes found";
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
    ui.autoSelect.value = value;
    updateAutoConfirmation()
});

NetworkTables.addKeyListener('/SmartDashboard/Auto Confirmation', (key, value) => {
    ui.autoConfirm.value = value;
    updateAutoConfirmation()
});
ui.autoSelect.addEventListener('change', (event) => {
    console.log('change');
    NetworkTables.putValue('/SmartDashboard/Selected Auto', event.target.value);
    updateAutoConfirmation();
});
let updateAutoConfirmation = () => {
    if (ui.autoSelect.value === ui.autoConfirm.value) {
        ui.autoConfirm.style.backgroundColor = 'green';
    } else {
        ui.autoConfirm.style.backgroundColor = 'red';
    }

};
NetworkTables.addKeyListener('/FMSInfo/EventName', (key, value) => {
    ui.matchInfo.event.innerHTML = value;
});
NetworkTables.addKeyListener('/FMSInfo/MatchNumber', (key, value) => {
    ui.matchInfo.match.number.innerHTML = value;
});

NetworkTables.addKeyListener('/FMSInfo/MatchType', (key, value) => {
    let matchTypeString;
    switch (value) {
        case 1:
            matchTypeString = 'Practice';
            break;
        case 2:
            matchTypeString = 'Qualification';
            break;
        case 3:
            matchTypeString = 'Elimination';
            break;
        default:
            matchTypeString = 'Unknown';
            break;
    }
    ui.matchInfo.match.type.innerHTML = matchTypeString + " ";
});

NetworkTables.addKeyListener('/Robot/BatteryVoltage', (key, value) => {
    ['low', 'warning', 'good'].forEach(it => {
        ui.batteryPanel.panel.removeAttribute(it)
    });
    value = Number.parseFloat(value).toFixed(2);
    ui.batteryPanel.readout.innerHTML = value;
    let state;
    if (value < 7) state = 'low';
    else if (value < 10) state = 'warning';
    else state = 'good';
    ui.batteryPanel.panel.toggleAttribute(state)
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

NetworkTables.addGlobalListener((key, value, isNew) => {
    console.log(key);
    if (!key.startsWith('/CameraPublisher')) return;
    let stream = key.split('/')[2];
    updateStream(getStream(stream));
    updateStreamList();
});

//Camera stream updates
NetworkTables.addKeyListener('/SmartDashboard/StreamURL', (key, value) => {
    ui.camera.setStreamURL(value);
});

let updateCameraStreamView = () => {
    let streamUrl = ui.cameraSelector.getSelectedStream().streams[0];
    if (typeof streamUrl != 'undefined') {
        ui.camera.setStreamURL(streamUrl);
    }
};

ui.cameraSelector.addEventListener('change', updateCameraStreamView);

let updateStream = (streamToUpdate) => {
    streamList.set(streamToUpdate.id, streamToUpdate);
};

let updateStreamList = () => {
    //Clear the selector
    while (ui.cameraSelector.firstChild) ui.cameraSelector.removeChild(ui.cameraSelector.firstChild);
    //If empty put a message
    if (streamList.size === 0) {
        let option = document.createElement('option');
        option.text = 'No streams available';
        ui.cameraSelector.add(option);
    }
    streamList.forEach((stream, id) => {
        let option = document.createElement('option');
        option.text = id;
        ui.cameraSelector.add(option);
    });
    updateCameraStreamView();
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

addEventListener('error', (ev) => {
    ipc.send('windowError', {mesg: ev.message, file: ev.filename, lineNumber: ev.lineno})
});

addEventListener('keydown', evt => {
    if (evt.key === 'w' && evt.ctrlKey) electron.getCurrentWindow().close();
});

let fullScreen = false;

ui.camera.addEventListener('dblclick', () => {
    if (fullScreen) {
        ui.camera.style.width = '60vw';
        ui.camera.style.height = '80vh';
        fullScreen = false;
    } else {
        ui.camera.style.width = '100vw';
        ui.camera.style.height = '100vh';
        fullScreen = true;
    }
});