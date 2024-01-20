
const charts = [];
let csvData = { timeStamp: [],
    chart1: [],chart2: [],chart3: [],chart4: [],chart5: [],chart6: [],chart7: [],chart8: [],chart9: [], chart10: [],
    chart11: [],chart12: [],chart13: [],chart14: [],chart15: [],chart16: [],chart17: [],chart18: [],chart19: [],chart20: [],
    chart21: [], chart22: [], chart23: [], chart24: [], chart25: [], chart26: [], chart27: [], chart28: [], chart29: [], chart30: [], chart31: [], chart32: []
};

let socket;

function updateConnectionStatus(connected) {
    if (connected) {
        console.log('Connected to ESP8266');
        document.getElementById('status').textContent = 'Connected to Smart Meter';
        document.getElementById('statusDot').style.backgroundColor = 'green';
    } else {
        console.log('Not connected to ESP8266');
        document.getElementById('status').textContent = 'Not connected to Smart Meter';
        document.getElementById('statusDot').style.backgroundColor = 'red';
    }
}

function connectToESP8266() {
    socket = new WebSocket('ws://' + window.location.hostname + ':81/');

    socket.onopen = function(event) {
        updateConnectionStatus(true);
    };

    socket.onmessage = function(event) {
        let sdata = event.data;
        
        const values = sdata.split(',').map(Number);
        updateGridData(sdata);
        checkStatus(sdata);
        console.log(sdata);
        const now = new Date().toLocaleTimeString();
        csvData['timeStamp'].push(now);
        values.forEach((value, index) => {
            if (index < charts.length) {
                const chart = charts[index];
                if (chart.data.labels.length > 50) {
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                }
                chart.data.labels.push('');
                chart.data.datasets[0].data.push(value);
                chart.update();
                csvData[`chart${index + 1}`].push(value);
            }
        });
    };

    socket.onerror = function(event) {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };


    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
        updateConnectionStatus(false);
        // Optionally set up a reconnection attempt
        setTimeout(connectToESP8266, 3000);
    };
}

function downloadAllGraphsCSV() {
    if (charts.length === 0 || charts[0].data.labels.length === 0) {
        console.error('No data to download');
        return;
    }

    let csvContent = "";
    let maxLength = Math.max(...Object.values(csvData).map(arr => arr.length));

    let headerRow = "Time,";
    let headerRows = ['Total Power', 'Total Energy', 'V R-Y', 'I R-Y', 'F R-Y', 'PF R-Y', 'V Y-B', 'I Y-B', 'F Y-B', 'PF Y-B', 'V B-R', 'I B-R', 'F B-R', 'PF B-R', 'V R', 'I R', 'P R', 'E R', 'F R', 'PF R', 'V Y', 'I Y', 'P Y', 'E Y', 'F Y', 'PF Y', 'V B', 'I B', 'P B', 'E B', 'F B', 'PF B'];
    headerRow += charts.map((_, index) => `${headerRows[index]}`).join(',');
    csvContent += headerRow + "\n";

    for (let i = 0; i < maxLength; i++) {
        let row = ``;
        Object.keys(csvData).forEach((key, index, array) => {
            row += csvData[key][i] !== undefined ? csvData[key][i] : "";
            if (index < array.length - 1) {
                row += ",";
            }
        });
        csvContent += row + "\n";
    }

    const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'SmartMeterData.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}






function updateGraphDisplay(selectedGraphIndex) {
    charts.forEach((chart, index) => {
        chart.canvas.style.display = (index === selectedGraphIndex) ? 'block' : 'none';
    });
}

function updateGridData(data) {
    const dataValues = data.split(',').map(value => parseFloat(value).toFixed(2));

    rowId1 = ['grid1-v', 'grid1-i', 'grid1-f', 'grid1-pf'];
    // Update grid 1
    rowId1.forEach((rows, index) => {
        gridRow = document.getElementById(rows).children;
        gridRow[1].textContent = dataValues[2 + index];
        gridRow[2].textContent = dataValues[6 + index];
        gridRow[3].textContent = dataValues[10 + index];
    });
    
    rowId2 = ['grid2-v', 'grid2-i', 'grid2-p', 'grid2-e', 'grid2-f', 'grid2-pf'];
    rowId2.forEach((rows, index) => {
        gridRow = document.getElementById(rows).children;
        gridRow[1].textContent = dataValues[14 + index];
        gridRow[2].textContent = dataValues[20 + index];
        gridRow[3].textContent = dataValues[26 + index];
    });

    document.getElementById('value-1').textContent = `Total Energy: ${dataValues[0]} kWh`;
    document.getElementById('value-2').textContent = `Total Power: ${dataValues[1]} kW`;
}

function checkStatus(data) {
    const dataValues = data.split(',').map(value => parseFloat(value).toFixed(0));

    let magInt = dataValues[32];
    let devCas = dataValues[33];
    let ovVolt = dataValues[34];
    let unVolt = dataValues[35];
    let ovCurrent = dataValues[36];
    
    let status = [magInt, devCas, ovVolt, unVolt, ovCurrent]
    let statuses = ['magnetic', 'casing', 'ovVolt', 'unVolt', 'ovCurrent']
    
    for(let i = 1; i <=5; i++){
        if(status[i-1] == 1){
            document.getElementById(`${statuses[i-1]}Dot`).style.backgroundColor = 'red';
            document.getElementById(`${statuses[i-1]}Dot`).style.animation = 'redBlink 0.3s infinite'
            document.getElementById(`${statuses[i-1]}Status`).textContent = 'Status: DETECTED!'
        } else {
            document.getElementById(`${statuses[i-1]}Dot`).style.backgroundColor = 'green';
            document.getElementById(`${statuses[i-1]}Dot`).style.animation = 'none'
            document.getElementById(`${statuses[i-1]}Status`).textContent = 'Status: NORMAL'
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    connectToESP8266();
    const chartContainer = document.getElementById('wrapper');
    let tlabels = ['Total Power', 'Total Energy', 'V R-Y', 'I R-Y', 'F R-Y', 'PF R-Y', 'V Y-B', 'I Y-B', 'F Y-B', 'PF Y-B', 'V B-R', 'I B-R', 'F B-R', 'PF B-R', 'V R', 'I R', 'P R', 'E R', 'F R', 'PF R', 'V Y', 'I Y', 'P Y', 'E Y', 'F Y', 'PF Y', 'V B', 'I B', 'P B', 'E B', 'F B', 'PF B'];
    for (let i = 1; i <= 32; i++) {   
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${i}`;
        canvas.style.display = i === 1 ? 'block' : 'none'; // Show only the first chart initially
        chartContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        charts.push(new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: tlabels[i-1],
                    data: [],
                    borderColor: '#007bff',
                    borderWidth: 2
                    
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: tlabels[i-1],
                        color: 'black',
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                    },
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        ticks: {
                            color: "#000"
                        }
                    }
                },
                maintainAspectRatio: false,
                elements: {
                    point:{
                        radius: 0
                    },
                    line: {
                        tension: 0.4  
                    }
                }
            }
        }));
    }

    const graphSelect = document.getElementById('graphSelect');
    for (let i = 1; i <= 32; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${tlabels[i-1]} Graph`;
        graphSelect.appendChild(option);
    }
    graphSelect.addEventListener('change', () => {
        const selectedGraphIndex = graphSelect.selectedIndex;
        updateGraphDisplay(selectedGraphIndex);
    });
    
    document.getElementById('downloadButton').addEventListener('click', downloadAllGraphsCSV);
    updateGraphDisplay(1);
});
