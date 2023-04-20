fetch('https://opensheet.elk.sh/1_1bhnvvCsoo6vIcML7Y-1R2OZICtJQ-kJxMqAqPshYQ/hdd')
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


    array.push([data[i].Model, data[i].Size, data[i].Coin, data[i].Power, data[i].MonthlyXCH, data[i].MonthlyUSD]);
}
fetch = document.getElementById('hdddata');
for (var i = 0; i < array.length; i++) {
    var newRow = fetch.insertRow(fetch.length);
    for (var j = 0; j < array[i].length; j++) {
        var cell = newRow.insertCell(j);
        cell.innerHTML = array[i][j];
    }
}

}