import {astergdem,geocode,getCountryInfo,getWeather,wikifinder} from "./ajaxcalls.js";
import {border} from "../countries.js"

// var map = L.map('map').setView([51.505, -0.09], 19); //Geographical co-ord & zoom level
var map = L.map("map",{zoomControl:false});

map.locate({enableHighAccuracy: true});
// map.locate({setView: true, maxZoom: 16, enableHighAccuracy: true});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, 
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.control.zoom({position:"topright"}).addTo(map);

function iconFinder(POI){
    let icon=L.icon({
        iconUrl: `./lib/images/${POI}.png`,
        iconSize: [30, 40],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
        // shadowUrl: 'my-icon-shadow.png',
        // shadowSize: [68, 95],
        // shadowAnchor: [22, 94]
    })
    return icon
}

function loader(toggle) {
    let x = document.getElementById("loading");
    if (toggle=="on"){
        x.style.display = "inline";
    }
    else{
        x.style.display = "none";
    }
  }

//Location error
function onLocationError(e) {
    alert(e.message);
}

map.on('locationerror', onLocationError);



//Location Found
let menudata;
let layer=[];
let POIlayer=[];
let featureControl;
let cluster = L.markerClusterGroup();

async function sidemenu(lat,lng,radius,firstCall=true) {
    let marker=L.marker({lat,lng});
    marker.addTo(map);
    layer.push(marker)

    if (firstCall != true){
    loader("on")
    L.circle({lat,lng}, radius).addTo(map);//
    }

    // Find average height above sea level
    astergdem(lat,lng);

    //Find address and other details from current longitude & latitude using OpenCage API
    let [address,country,cntrycode,currency,qibla,cc,cntry3code]= await geocode(`${lat},${lng}`)
    .then((response)=> {
        // console.log("1 JSON Response from geocode API: ",response); //for troubleshooting
        let address = response.results[0].formatted;//
        let country = response.results[0].components.country;
        let cntrycode = response.results[0].components["ISO_3166-1_alpha-2"]
        let currency = response.results[0].annotations.currency
        let qibla= response.results[0].annotations.qibla;
        let cc=response.results[0].annotations.callingcode;
        let cntry3code = response.results[0].components["ISO_3166-1_alpha-3"];


        let data=[address,country,cntrycode,currency,qibla,cc,cntry3code];
        return data
    });

    // Add popup message to initial marker
    if (firstCall==true){
        marker.bindPopup(address).openPopup();// 
    }
    
    // const x= map.removeLayer(marker);

    //Find further country details using geonames countryInfo API
    let [capital,population, bbox,bbox2]= await getCountryInfo(cntrycode)
    .then((response)=>{
        let result = response.geonames[0];
        // console.log("2 PJSON Response from genomae getCountryInfo API: ",response); //for troubleshooting
        let capital = result.capital;
        let population= result.population;
        let bbox=[[result.north, result.east],[result.south, result.west]]
        let bbox2=[result.west,result.south,result.east,result.north]
        let data=[capital,population, bbox,bbox2];
        map.fitBounds(bbox)
        return data
    })

    //Find weather data using openweathermap API
    let [current,future] = await getWeather(lat,lng)
    .then((response)=>{
        let current=[response.current.temp,response.current.weather[0].description];
        let future =[];
        for (let x=0;x<3;x++){
            let dailyforecast={};
            let day=response.daily[x].dt;
            day = new Date(day * 1000);
            day = day.toLocaleDateString("en-GB");
            let temp=response.daily[x].temp.day;
            let descrip=response.daily[x].weather[0].description;
            dailyforecast[day]=[temp,descrip];
            future.push(dailyforecast);
        }
        let weatherdata=[current,future];
        return weatherdata
    })

    //Find relevant wikilinks using geoname API: findNearbyWikipedia
    let wikilinks= await wikifinder(lat,lng)
    .then((response)=>{
        let wikilinks=[]
        for (let x=0;x<3;x++){
            let wikiset=[]
            try{
                // console.log(response.geonames[0].wikipediaUrl);
                wikiset.push(response.geonames[x].title);
                wikiset.push(response.geonames[x].wikipediaUrl);
                wikilinks.push(wikiset);
            }
            catch{
                break;
            }
        }
        return wikilinks
    })

    /*Combining all relevant information from all APIs*/
    let counter=0
    function toDisplay(attribute,value,logo){
        counter ++
        let element=""
        if (counter%2==0){
            element="even";
        }
        else {
            element="odd";
        }
        return(
`<table class="${element}">
    <tr>
        <td id="first">
            <img class="images" src=${logo}>
        </td>
        <th class="attribute">
            ${attribute}
        </th>
        <td class="value">
            ${value}
        </td>
    </tr>
</table>
        `)
    }

    country=toDisplay("Country: ", country,`./lib/images/country.png`);
    capital=toDisplay("Capital City: ", capital,`./lib/images/capital_city.png`);
    population=toDisplay("Population size: ",population,`./lib/images/pop_size.png`);
    current=toDisplay("Current weather: ",`temp:${current[0]} <br> summary:${current[1]}`,`./lib/images/weather2.png`);
    let futurelst=[];
    let i=0;
    for (let index of future){
        Object.entries(index).forEach(([key, value]) => {
            futurelst.push(`
            <p>Date:${key} <br> Temperature:${value[0]} <br> Description:${value[1]}</p>`)
        });
    }
    futurelst=futurelst.join("\n");

    /**DISPLAY */
    futurelst=toDisplay("Weather Forecast for next 3 days: ",futurelst,"lib/images/weather2.png")

    let htmlwikilinks=[]
    for (let wikilink of wikilinks) {
        htmlwikilinks.push(`<a href="${wikilink[1]}" target="_blank">${wikilink[0]}</a><br>`)
    }
    htmlwikilinks=htmlwikilinks.join("\n");

    /**DISPLAY */
    htmlwikilinks=toDisplay("Wikilinks",htmlwikilinks,`./lib/images/link.png`)
    currency=toDisplay("Currency: ", `Name: ${currency.name}</br>Symbol: ${currency.symbol}`,"./lib/images/currency.png");
    qibla=toDisplay("Direction to qibla: ", `${qibla} degrees from North`,"./lib/images/qibla.png");
    cc=toDisplay("Calling Code: ", `+${cc}`,`./lib/images/callingcode.png`);
    let fullcontent=country+capital+population+current+futurelst+htmlwikilinks+currency+qibla+cc;
    
    // console.log(fullcontent);

    /**EXPERIMENTAL */
    let POIs=["airport","library","cinema","hospital"]
    for (let POI of POIs){
        let subPOIs= await fetch(`https://discover.search.hereapi.com/v1/discover?in=bbox:${bbox2}&in=countryCode:${cntry3code}&q=${POI}&limit=100&apiKey=aOSyvydDLX2RXnWJ28s9gCEpOY6SG8zs2vg46YZMbWw`)
        // let subPOIs= await fetch(`https://discover.search.hereapi.com/v1/discover?at=${lat},${lng}&in=countryCode:${cntry3code}&q=airport&limit=100&apiKey=aOSyvydDLX2RXnWJ28s9gCEpOY6SG8zs2vg46YZMbWw`)
        // let subPOIs= await fetch(`https://discover.search.hereapi.com/v1/discover?in=circle:${lat},${lng};r=10000000&q=gym&limit=100&apiKey=aOSyvydDLX2RXnWJ28s9gCEpOY6SG8zs2vg46YZMbWw`)
        .then(response => (response.json()))
        // console.log(subPOIs)
        
        const markers=[]
        for (let place of subPOIs.items){
            const marker=L.marker([place.access[0].lat,place.access[0].lng], {icon: iconFinder(POI)});
            markers.push(marker)
        }
        const x=L.layerGroup(markers)
        POIlayer.push(x)
        // console.log("PUSHED")
        // x.addTo(map)

        cluster.addLayer(x);
	    map.addLayer(cluster);
		// map.fitBounds(cluster.getBounds());
    }
    let overlayMaps = {
        // <img src='./lib/images/airport.png' /> 
        "Airport": POIlayer[0],
        "Library": POIlayer[1],
        "Cinema": POIlayer[2],
        "Hospital": POIlayer[3]
    };
    // featureControl = L.control.layers(null, overlayMaps,{position:"bottomright",interactive:false})
    // featureControl.addTo(map);

    try{
        if (firstCall==true) {
            menudata = L.control.slideMenu(fullcontent,{position: "topright",
            menuposition: "topright",
            width: "30%",
            height: "100%",
            delay: "10",
        }).addTo(map);
        }
        else {
            // console.log(menudata)
            menudata.setContents(fullcontent);
            loader("off")
            // return menudata;
        }
        }
    catch(e){
        console.log(e);
    };


    // let cities=[]
    // let citymarkers=[]
    // for (let city of citiesdata.geonames){
    //     // console.log(city)
    //     cities.push(`${city.toponymName}`)
    //     citymarkers.push(L.marker([city.lat, city.lng]))
    // }
    let selborder;
    for (let feature of border.features){
        if (feature.id==cntry3code){
            selborder=feature
        }
    }

    selborder=L.geoJSON(selborder)
    layer.push(selborder)
    selborder.addTo(map);

}
function onLocationFound(e){
    let lat=e.latlng.lat;
    let lng=e.latlng.lng;
    let radius=e.accuracy;
    sidemenu(lat,lng,radius)
}
map.on('locationfound', onLocationFound);


const submit= document.getElementById("submit");
const myInput= document.getElementById("myInput");
submit.addEventListener('click', () => {
    fetch(`https://restcountries.com/v3.1/name/${myInput.value}`).then(resp=>{
        return resp.json();
    }).then(json=>{
        // console.log("Response from rest countries API: ",json);
        let lat=json[0].capitalInfo.latlng[0];
        let lng=json[0].capitalInfo.latlng[1];
        for (let x=0;x<layer.length;x++){
            map.removeLayer(layer[x]);
        }
        POIlayer[0].clearLayers()
        POIlayer[1].clearLayers()
        POIlayer[2].clearLayers()
        POIlayer[3].clearLayers()
        // featureControl.remove()
        // for (let marker of POIlayer[0]){
        //     map.removeLayer(marker)
        // }
        POIlayer=[]
        layer=[]
        sidemenu(lat,lng,"",false);
    })
})


