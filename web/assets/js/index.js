function callAjax(url, callback) {
    var xmlhttp;
    // compatible with IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
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
            return collection[j];
        }
    }
    return null;
}

function initMap() {
    const kiev = { lat: 50.45466, lng: 30.5238 };
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: kiev,
    });

    const api = $('body').data('url');

    callAjax(api + "/stations/findall", (stations) => {
        const infowindow = new google.maps.InfoWindow({
            content: "N/A",
        });
        for (const station of stations.data) {
            if (
                station.fuelLimits.some(e => e.fuel.description.includes('95') && (e.limitType === 'BANK_CARD'
                    || e.limitType === 'CASH' || e.limitType === 'MOBILE_APP'))
            ) {
                const description = filter(station.fuelLimits, limit => limit.fuel.description.includes('95')
                    && (limit.limitType === 'BANK_CARD' || limit.limitType === 'CASH' || limit.limitType === 'MOBILE_APP')).description;
                const marker = new google.maps.Marker({
                    position: {
                        lat: station.geoPoint.lat,
                        lng: station.geoPoint.lon
                    },
                    label: '95',
                    map: map,
                });

                marker.addListener("click", () => {
                    infowindow.setContent(description);
                    infowindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: false,
                    });
                });
            } else {
                let url = "https://maps.google.com/mapfiles/ms/icons/";
                url += 'purple' + "-dot.png";

                const marker = new google.maps.Marker({
                    position: {
                        lat: station.geoPoint.lat,
                        lng: station.geoPoint.lon
                    }, map: map,
                    icon:
                    {
                        url: url,
                        labelOrigin: new google.maps.Point(60, 30)
                    }
                });
            }
        }
    });
}

window.initMap = initMap;