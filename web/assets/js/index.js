function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return decodeURI(pair[1]);
        }
    }
    return false;
}

const copyToClipboard = str => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText)
        return navigator.clipboard.writeText(str);
    return Promise.reject('The Clipboard API is not available.');
};

function copyLinkCallback() {
    copyToClipboard($('#copyLink').val());
    $(".message").text("скопiйованно в буфер");
}

function callAjax(url, callback) {
    var xmlhttp;
    // compatible with IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callback(JSON.parse(xmlhttp.responseText));
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function filter(collection, predicate) {
    var result = new Array();
    var length = collection.length;

    for (var j = 0; j < length; j++) {
        if (predicate(collection[j]) == true) {
            result.push(collection[j]);
        }
    }
    return result;
}

var markersArray = new Array();
var stationsArray = new Array();

function filterAndRenderStations(map) {

    var linkQuery = window.location.origin + window.location.pathname + "?";

    const infowindow = new google.maps.InfoWindow({
        content: "N/A",
    });

    const fuelsArray = $('#fuel').val();
    if (fuelsArray.length) {
        linkQuery += "fuel=" + encodeURI(fuelsArray.join(',')) + "&";
    }
    const fuelFilterFunction = function(fuelLimit) {
        return fuelsArray.includes(fuelLimit.fuel.normalizedStandard);
    }
    const limitTypeFilters = new Array();

    if ($('#special').is(':checked')) {
        linkQuery += "special=true&";
        limitTypeFilters.push('PALYVNA_CARD');
        limitTypeFilters.push('TALON');
    }

    if ($('#special_transport').is(':checked')) {
        linkQuery += "special_transport=true&";
        limitTypeFilters.push('TRANSPORT');
    }

    if ($('#money').is(':checked')) {
        linkQuery += "money=true&";
        limitTypeFilters.push('BANK_CARD');
        limitTypeFilters.push('CASH');
        limitTypeFilters.push('MOBILE_APP');
    }

    window.shareLink = linkQuery;

    const specialFilterFunction = function(fuelLimit) {
        return limitTypeFilters.includes(fuelLimit.limitType);
    }

    const filterFunction = e => fuelFilterFunction(e) && specialFilterFunction(e);
    for (const station of stationsArray) {
        if (station.fuelLimits.some(e => filterFunction(e))) {
            const descriptions = filter(station.fuelLimits, filterFunction)
                .map((el, i) => el.description);
            const description = [...new Set(descriptions)].join('\n');
            const marker = new google.maps.Marker({
                position: {
                    lat: station.geoPoint.lat,
                    lng: station.geoPoint.lon
                },
                //                    label: fuelFilter,
                map: map,
            });

            marker.addListener("click", () => {
                map.panTo(marker.getPosition());
                infowindow.setContent(description);
                infowindow.open({
                    anchor: marker,
                    map,
                    shouldFocus: false,
                });
            });
            markersArray.push(marker);
        } else {
            let url = "https://maps.google.com/mapfiles/ms/icons/" + 'purple' + "-dot.png";

            const marker = new google.maps.Marker({
                position: {
                    lat: station.geoPoint.lat,
                    lng: station.geoPoint.lon
                },
                map: map,
                icon: {
                    url: url,
                    labelOrigin: new google.maps.Point(60, 30)
                }
            });
            markersArray.push(marker);
        }
    }
}

function parseIntI(str, radix, defaultValue) {
    const parsed = parseInt(str, radix);
    return isNaN(parsed) ? defaultValue : parsed;
}

function parseFloatI(str, defaultValue) {
    const parsed = parseFloat(str);
    return isNaN(parsed) ? defaultValue : parsed;
}

function initMap() {
    $('select').multiselect();
    const fuelQueryParam = getQueryVariable('fuel');
    if (fuelQueryParam) {
        var fuelsArray = fuelQueryParam.split(',');
        if (fuelsArray.includes('M95')) {
            fuelsArray.push('М95');
        }
        $('#fuel').multiselect('deselectAll', false)
            .multiselect('select', fuelsArray, true);
    }

    $('#money').prop("checked", getQueryVariable('money'));
    $('#special_transport').prop("checked", getQueryVariable('special_transport'));
    $('#special').prop("checked", getQueryVariable('special'));

    $('#select95AndHigher').on('click', function() {
        $('#fuel').multiselect('deselectAll', false)
            .multiselect('select', ['PULLS 95', 'М100', '98', 'М95', '95'], true);
    });
    $('#selectDieselAndHigher').on('click', function() {
        $('#fuel').multiselect('deselectAll', false)
            .multiselect('select', ['МДП+', 'PULLS Diesel', 'МДП', 'ДП'], true);
    });
    $('#selectGasAndHigher').on('click', function() {
        $('#fuel').multiselect('deselectAll', false)
            .multiselect('select', ['ГАЗ'], true);
    });

    const center = {
        lat: parseFloatI(getQueryVariable('map.center.lat'), 50.45466),
        lng: parseFloatI(getQueryVariable('map.center.lng'), 30.5238)
    };
    const zoom = parseIntI(getQueryVariable('map.zoom'), 10, 7);
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: zoom,
        center: center,
    });

    window.map = map;

    $('#sharemodal').on('shown.bs.modal', function() {
        $('#copyLink').val(window.shareLink +
            "map.center.lat=" + map.getCenter().lat() +
            "&map.center.lng=" + map.getCenter().lng() +
            "&map.zoom=" + map.getZoom()
        );
    });

    const api = $('body').data('url');

    callAjax(api + "/stations/findall", (stations) => {
        stationsArray = stations.data;

        filterAndRenderStations(map);

        $('#go').on('click', e => {
            while (markersArray.length) {
                markersArray.pop()
                    .setMap(null);
            }
            filterAndRenderStations(map);
        });
    });
}

window.initMap = initMap;