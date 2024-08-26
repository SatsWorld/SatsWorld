import geoData from './countries.geo.json' with { type: 'json' };
import satsData from './countries.sats.json' with { type: 'json' };

var map = L.map('map', {
    maxZoom: 10,
    continuousWorld: false,
    noWrap: true
}).setView([0, 0], 2);

let satsToString = (sats, includeB) => { return (includeB ? "₿" : "") + " " + Intl.NumberFormat().format(sats); }

init();

function init(){
    var satsSold = satsData.reduce((accumulator, currentObject) => {
        if(currentObject.transaction.trim() !== '')
        {
            return accumulator + currentObject.satoshi;
        } else {
            return accumulator;
        }
    }, 0);
    var satsAvailable = 100000000 - satsSold;
    var countriesAvailable = satsData.filter(item => typeof item.transaction === "string" && item.transaction.trim() === '').length;
    var countriesSold = 178 - countriesAvailable;

    //Country list
    var countryListModalBody = document.getElementById("countryListModalBody");
    countryListModalBody.innerHTML = `
        <ul class="list-group pb-3">
        <li class="list-group-item d-flex justify-content-between align-items-center list-group-item-danger">
            Satoshis sold
            <span class="badge text-bg-danger rounded-pill">${satsToString(satsSold)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center list-group-item-success">
            Satoshis available
            <span class="badge text-bg-success rounded-pill">${satsToString(satsAvailable)}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center list-group-item-danger">
            Countries sold
            <span class="badge text-bg-danger rounded-pill">${countriesSold}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center list-group-item-success">
            Countries available
            <span class="badge text-bg-success rounded-pill">${countriesAvailable}</span>
        </li>
        </ul>
`;
    var divListGroup = document.createElement("div");
    divListGroup.classList = "list-group";

    satsData.sort((a,b) => {
        if (a.country < b.country) {
            return -1;
        }
        if (a.country > b.country) {
            return 1;
        }
        // a must be equal to b
        return 0;
    }).filter(item => {
        var available = item.transaction === "";
        var messageUrl = '<a href="'+item.messageUrl+'" target="_blank">'+item.message+'</a>';

        var countryListItem = document.createElement("a");
        countryListItem.classList = "list-group-item list-group-item-action" + (available ? '' : ' list-group-item-warning');
        
        if(available){
            countryListItem.href = "#";
            countryListItem.addEventListener('click', function(){
                displayInstructionDialog(item);
            });
        } else {
            countryListItem.setAttribute("href", item.url);
            countryListItem.target = "_blank";
        }
        countryListItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${item.country}</h5>
                <small>${(available ? 'Available' : 'SOLD!')}</small>
            </div>
            <div>${satsToString(item.satoshi, true)} sats</div>
            <p class="mb-1"><a href="${item.url}" target="_blank">${item.message}</a></p>
        `;
        divListGroup.appendChild(countryListItem);
    });
    countryListModalBody.append(divListGroup);
};

var geojson;

geojson = L.geoJson(geoData, 
    {
        style: styleCountry,
        onEachFeature: onEachFeature
    }).addTo(map);

function countryImageSrc (countryId){
    return `country-images/${countryId}.jpg`;
}
function displayCountryDialog(item){
    var available = item.transaction === "";
    if(available){
        displayInstructionDialog(item);
    } else {

        document.getElementById('countryModalLabel').innerHTML = item.country;
        document.getElementById('countryModalBody').innerHTML = `
        <p>
            <b>Status:</b>
            <a href="https://mempool.space/tx/${item.transaction}" target="_blank">Owned</a>
        </p>
        <p>
            <b>Message:</b>
            <a href="${item.url}'" target="_blank">${item.message}</a>
        </p>
        <p>
            <a href="${item.url}" target="_blank"><img src="${countryImageSrc(item.id)}" class="img-fluid" /></a>
        </p>
        `;
        const modal = new bootstrap.Modal('#countryModal');
        modal.show();
    }
}

(function() {
    var control = new L.Control({position:'topright'});
    control.onAdd = function(map) {
            var azoom = L.DomUtil.create('a','resetzoom');
            azoom.innerHTML = "<button>Reset Zoom</button>";
            L.DomEvent
                .disableClickPropagation(azoom)
                .addListener(azoom, 'click', function() {
                    map.setView([0, 0], 2);
                },azoom);
            return azoom;
        };
    return control;
}())
.addTo(map);

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = (props ?
        '<b>' + props.name + '</b><br />'
        : 'Hover over a country');
};   

info.addTo(map);

function updateInstruction(countrySats){
    var countryElement = document.getElementById("countryInstructionModalLabel");
    countryElement.innerHTML = countrySats.country;

    var sats = document.getElementById("countrySats");
    sats.innerHTML = '₿ ' + satsToString(countrySats.satoshi) + ' sats';
    var address = document.getElementById("countryAddress");
    address.innerHTML = countrySats.address;

    var costUrl = '<a class="btn btn-success" href="bitcoin:'+countrySats.address+'?amount='+satoshisToBitcoin(countrySats.satoshi)+'" target="_blank">Buy Now for ₿ ' + satsToString(countrySats.satoshi) + ' sats</a>';
    var receiveElement = document.getElementById("countryModalFooter");
    receiveElement.innerHTML = costUrl;
}

function displayInstructionDialog(country)
{
    updateInstruction(country);
    const modal = new bootstrap.Modal('#countryInstructionModal');
    modal.show();
}

function satoshisToBitcoin(satoshis) {
    return satoshis / 100000000;
}

function styleCountry(feature) {
    var found = satsData.filter(function(item) { return item.id ===  feature.id; })[0];
    var available = found.transaction === "";
    if(available){
        return {
            color: 'teal',
            weight: 2
        };
    }else {
        return {
            color: 'orangered',
            opacity: 1,
            fillOpacity: 0.9,
            fillColor: 'orange',
            weight: 2,
            fill: `url(${countryImageSrc(found.id)})`,
        };
    }
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 4,
        dashArray: '',
        fillOpacity: .5
    });

    layer.bringToFront();

    info.update(layer.feature.properties);
}

function resetHighlight(e) {

    geojson.resetStyle(e.target);
    info.update();
}

function featureClickHandler(e) {
    map.fitBounds(e.target.getBounds());

    //Dialog popup
    var found = satsData.filter(function(item) { return item.id ===  e.target.feature.id; })[0];
    if(found){
        displayCountryDialog(found);
    }
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: featureClickHandler 
    });
}