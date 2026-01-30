	/**********Superfilter****************/
		
		function filterKarte() {
    var gewaehlteKreise = Array.from(document.querySelectorAll('.kreis-check:checked')).map(cb => cb.value);
    var alleKreiseAktiv = document.getElementById('kreise').checked;
    var alleKatAktiv = document.getElementById('all-kategorien').checked;
    var gewaehlteKat = Array.from(document.querySelectorAll('.kat-check:checked')).map(cb => cb.value);
    var gewaehlterPreis = parseFloat(document.getElementById('preis-slider').value);
    
    var effektiverStart = startFilter;
    var effektiverEnd = endFilter ? endFilter : startFilter;
    
    var wertAnzeige = document.getElementById('preis-wert');
    if (wertAnzeige) wertAnzeige.innerText = gewaehlterPreis;

    var parseDate = function(str) {
        if(!str) return null;
        var d = str.trim().split('.');
        var tag = parseInt(d[0]);
        var monat = parseInt(d[1]) - 1;
        var jahr = d[2] ? parseInt(d[2]) : 2026;
        return new Date(jahr, monat, tag);
    };

    // Filter Landkreise
    layer_landkreis_1.eachLayer(function(layer) {
        var name = String(layer.feature.properties['gen']);
        if (alleKreiseAktiv || gewaehlteKreise.includes(name)) {
            layer.setStyle({opacity: 1, weight: 1.2, interactive: true});
        } else {
            layer.setStyle({opacity: 0, weight: 0, interactive: false});
        }
    });

    // Filter Festivals
    layer_festival_2.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties) {
            var props = layer.feature.properties;
            var fKreis = String(props['gen']);
            var fKat = String(props['Kategorie']);
            var fPreis = parseFloat(props['Preise ab']);
            var fDatumRaw = String(props['Datum']); 
            var datumCheck = true; 
            
            if (effektiverStart && effektiverEnd) {
                var teile = fDatumRaw.split(/[-–]| bis /);
                var festivalStart = parseDate(teile[0]);
                var festivalEnd = teile[1] ? parseDate(teile[1]) : festivalStart;
                datumCheck = (festivalStart <= effektiverEnd && festivalEnd >= effektiverStart);
            }

            var kreisCheck = (alleKreiseAktiv || gewaehlteKreise.includes(fKreis));
            var katCheck = (alleKatAktiv || gewaehlteKat.includes(fKat));
            var preisCheck = (isNaN(fPreis) || fPreis === null || fPreis <= gewaehlterPreis);

            if (layer.getElement()) {
                if (kreisCheck && katCheck && preisCheck && datumCheck) {
                    layer.getElement().style.display = 'block';
                } else {
                    layer.getElement().style.display = 'none';
                }
            }
        }
    });
}

// Hier folgen nun die restlichen Funktionen und Variablen
let startFilter = null;
let endFilter = null;
let currentViewDate = new Date();

function zentriereAufAuswahl() {
    var gewaehlteKreise = Array.from(document.querySelectorAll('.kreis-check:checked')).map(cb => cb.value);
    var alleKreiseAktiv = document.getElementById('kreise').checked;
    var bounds = new L.LatLngBounds();
    var hatSichtbareKreise = false;

    layer_landkreis_1.eachLayer(function(layer) {
        var name = String(layer.feature.properties['gen']);
        if (alleKreiseAktiv || gewaehlteKreise.includes(name)) {
            bounds.extend(layer.getBounds());
            hatSichtbareKreise = true;
        }
    });

    if (hatSichtbareKreise) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12, animate: true });
    }
}

function resetFilter() {
    document.getElementById('kreise').checked = true;
    document.getElementById('all-kategorien').checked = true;
    document.querySelectorAll('.kreis-check').forEach(cb => cb.checked = true);
    document.querySelectorAll('.kat-check').forEach(cb => cb.checked = true);
    document.getElementById('preis-slider').value = 300;
    var preisAnzeige = document.getElementById('preis-wert');
    if (preisAnzeige) preisAnzeige.innerText = '300';
    startFilter = null;
    endFilter = null;
    currentViewDate = new Date();
    renderKalender();
    filterKarte();
}

function renderKalender() {
console.log("Kalender wird geladen!");
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('month-display');
    if (!grid) return;
    grid.innerHTML = '';
	
	
    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    monthDisplay.innerText = `${monthNames[currentViewDate.getMonth()]} ${currentViewDate.getFullYear()}`;
    
    ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach(day => {
        const div = document.createElement('div');
        div.className = 'day-name';
        div.innerText = day;
        grid.appendChild(div);
    });

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < offset; i++) grid.appendChild(document.createElement('div'));

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerText = d;
		
		// --- HEUTE-LOGIK START ---
    const heute = new Date();
    const istHeute = d === heute.getDate() && 
                     month === heute.getMonth() && 
                     year === heute.getFullYear();

    if (istHeute) {
        dayEl.classList.add('today');
        console.log("Heute erkannt:", d); // Kontrollausgabe in der F12-Konsole
    }
    // --- HEUTE-LOGIK ENDE ---
		
        if (startFilter && date.toDateString() === startFilter.toDateString()) dayEl.classList.add('selected');
        if (endFilter && date.toDateString() === endFilter.toDateString()) dayEl.classList.add('selected');
        if (startFilter && endFilter && date > startFilter && date < endFilter) dayEl.classList.add('in-range');
        
        dayEl.onclick = () => {
            if (!startFilter || (startFilter && endFilter)) {
                startFilter = date;
                endFilter = null;
            } else if (date < startFilter) {
                startFilter = date;
            } else {
                endFilter = date;
            }
            renderKalender();
            filterKarte();
        };
        grid.appendChild(dayEl);
    }
}

function changeMonth(diff) {
    currentViewDate.setMonth(currentViewDate.getMonth() + diff);
    renderKalender();
}
document.addEventListener("DOMContentLoaded", function() {
    renderKalender();
});
function toggleCheckboxes() {
    var list = document.getElementById("checkbox-list");
    list.style.display = (list.style.display === "block") ? "none" : "block";
}
function setAll(status) {
    document.getElementById('kreise').checked = status;
    var checks = document.querySelectorAll('.kreis-check');
    checks.forEach(c => c.checked = status);
    filterKarte();
}
function updateAllCheckbox() {
    var allCheckbox = document.getElementById('kreise');
    var checks = document.querySelectorAll('.kreis-check');
    var total = checks.length;
    var checkedCount = document.querySelectorAll('.kreis-check:checked').length;
    allCheckbox.checked = (total === checkedCount);
}
function updateAllKatCheckbox() {
    var allCheckbox = document.getElementById('all-kategorien'); 
    var checks = document.querySelectorAll('.kat-check');
    var total = checks.length;
    var checkedCount = document.querySelectorAll('.kat-check:checked').length;
    allCheckbox.checked = (total === checkedCount);
}
function setAllKat(status) {
    document.getElementById('all-kategorien').checked = status;
    var checks = document.querySelectorAll('.kat-check');
    checks.forEach(c => c.checked = status);
    filterKarte();
}
function toggleKatCheckboxes() {
    var list = document.getElementById("kat-checkbox-list");
    list.style.display = (list.style.display === "block") ? "none" : "block";
}	