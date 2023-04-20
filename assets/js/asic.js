fetch('https://opensheet.elk.sh/1_1bhnvvCsoo6vIcML7Y-1R2OZICtJQ-kJxMqAqPshYQ/asic')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        appendData(data);
    })
    .catch(function (err) {
        console.log('error: ' + err);
    });

function appendData(data) {
    const array = [];
    for (var i in data) {
        array.push([data[i].Model, data[i].Release, data[i].Hashrate, data[i].Power, data[i].Noise, data[i].Algo, data[i].Profitabilityday]);
    }
    fetch = document.getElementById('asicdata');
    for (var i = 0; i < array.length; i++) {
        var newRow = fetch.insertRow(fetch.length);
        for (var j = 0; j < array[i].length; j++) {
            var cell = newRow.insertCell(j);
            cell.innerHTML = array[i][j];
        }
    }
}