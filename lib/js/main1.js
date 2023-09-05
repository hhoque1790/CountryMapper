import {astergdem,geocode,getCountryInfo,getWeather,wikifinder,getChildren} from "./ajaxcalls.js";
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
        iconSize: [30, 40], //[x,y]
        iconAnchor: [15,40], //[x,y]
        popupAnchor: [0,-38],
        // shadowUrl: 'my-icon-shadow.png',
        // shadowSize: [68, 95],
        // shadowAnchor: [22, 94]
    })
    return icon
}

function loader(toggle) {
    if (toggle=="on"){
        document.getElementById("searchicon").src = "./lib/images/loading.gif";
        document.getElementById("submit").disabled = true;
    }
    else{
        document.getElementById("submit").disabled = false;
        document.getElementById("searchicon").src = "./lib/images/search.png";
    }
}
console.log("hello")
//Location error
function onLocationError(e) {
    alert(e.message);
}

map.on('locationerror', onLocationError);

async function cgeocode(lat,lng) {
    console.log("starting-cgeocode")
    let response= await geocode(`${lat},${lng}`)
    // console.log(response)
    let result=response.results[0]
    console.log("cgeocode: ",result)
    let town;
    switch(true) {
        case (result.components.town!==undefined):
            town= result.components.town
            break;
        case (result.components.city!==undefined):
            town= result.components.city
            break;
        default:
            console.log("geocode API: Error: Unable to find location name")
    }
    let address = result.formatted;
    let country = result.components.country;
    let cntrycode = result.components["ISO_3166-1_alpha-2"]
    let currency = result.annotations.currency
    let qibla= result.annotations.qibla;
    let cc=result.annotations.callingcode;
    let cntry3code = result.components["ISO_3166-1_alpha-3"];
    let data=[town,address,country,cntrycode,currency,qibla,cc,cntry3code];
    console.log("DONE-cgeocode")
    return data
};

async function cgetWeather(lat,lng){
    console.log("starting-cgetWeather")
    let response = await getWeather(lat,lng)
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
    console.log("DONE-cgetWeather")
    return weatherdata
}

async function cwikifinder(lat,lng){
    console.log("starting-cwikifinder")
    let response= await wikifinder(lat,lng)
    let wikilinks=[]
    for (let x=0;x<3;x++){
        let wikiset=[]
        try{
            wikiset.push(response.geonames[x].title);
            wikiset.push(response.geonames[x].wikipediaUrl);
            wikilinks.push(wikiset);
        }
        catch{
            break;
        }
    }
    console.log("DONE-cwikifinder")
    return wikilinks
}
async function cgetCountryInfo(cntrycode){
    console.log("starting-cgetCountryInfo")
    let response = await getCountryInfo(cntrycode)
    // console.log(response)
    let result=response.geonames[0]
    console.log("2 PJSON Response from genomae getCountryInfo API: ",response); //for troubleshooting
    let capital = result.capital;
    let population= result.population;
    let bbox=[[result.north, result.east],[result.south, result.west]]
    let bbox2=[result.west,result.south,result.east,result.north]
    let geonameId=result.geonameId;
    let data=[capital,population, bbox,bbox2,geonameId];
    map.fitBounds(bbox)
    console.log("DONE-cgetCountryInfo")
    return data   
}

function toDisplay(attribute,value,logo,counter){
    counter ++
    let element=""
    if (counter%2==0){
        element="even";
    }
    else {
        element="odd";
    }
    return([
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
    `,
counter])
}

async function poiFinder(bbox2,cntry3code,POI){
    console.log(POI)
    let subPOIs= await fetch(`https://discover.search.hereapi.com/v1/discover?in=bbox:${bbox2}&in=countryCode:${cntry3code}&q=${POI}&limit=100&apiKey=mR_pk-Wce4lCMoOLqqI4nSoqaFGQoJQKTxHjGbHq3SE`)
    // let subPOIs= await fetch(`https://discover.search.hereapi.com/v1/discover?at=${lat},${lng}&in=countryCode:${cntry3code}&q=airport&limit=100&apiKey=aOSyvydDLX2RXnWJ28s9gCEpOY6SG8zs2vg46YZMbWw`)
    // let subPOIs= await fetch(`https://discover.search.hereapi.com/v1/discover?in=circle:${lat},${lng};r=10000000&q=gym&limit=100&apiKey=aOSyvydDLX2RXnWJ28s9gCEpOY6SG8zs2vg46YZMbWw`)
    subPOIs=await subPOIs.json()
    const markers=[]
    for (let place of subPOIs.items){
                    /// For troubleshooting marker and marker pop-up message positions///
        // if (POI=="hospital"){
        //     let marker=L.marker([place.access[0].lat,place.access[0].lng]).bindPopup(place.address.label);
        //     markers.push(marker)
        //     marker=L.marker([place.access[0].lat,place.access[0].lng], {icon: iconFinder(POI)}).bindPopup(place.address.label);
        //     markers.push(marker)
        // }
                    /// For troubleshooting marker and marker pop-up message positions///
        const marker=L.marker([place.access[0].lat,place.access[0].lng], {icon: iconFinder(POI)}).bindPopup(place.address.label);
        markers.push(marker)
    }

    const x=L.layerGroup(markers)
    POIlayer.push(x)

    // x.addTo(map)

    cluster.addLayer(x);
    map.addLayer(cluster);
    // map.setView([53.66577,-2.63660], 19)

    // map.fitBounds(cluster.getBounds());
}

async function cchildren(geonameId){
    console.log("starting-cchildren")
    let response = await getChildren(geonameId)
    let result= response.geonames
    let childrenId=[]
    for (let child of result){
        childrenId.push(child.geonameId)
    }
    // console.log("result: ",result)
    console.log("DONE-cchildren")
    return childrenId   
}

let menudata;// Contains content of side menu displayed for selected country. Needed for update.
let layer=[];// Contains all markers besides POI markers (i.e. current location/ Capital city). Needed for removal.
let POIlayer=[]; // Contains all POI markers.  Needed for removal after each submit.
let featureControl;
let cluster = L.markerClusterGroup(); // Contains cluster info. Needed for removal after each submit.

async function main(lat,lng,radius,firstCall=true) {
    loader("on")

    /**-----------------------------INFO FROM API CALLS-----------------------------*/
    astergdem(lat,lng);
    let results;
    try{
        results= await Promise.all([cgeocode(lat,lng),cgetWeather(lat,lng),cwikifinder(lat,lng)])
    }
    catch(error){
        console.log(error)
    }

    let [cntryInfo, weather, wikinder] = new Set(results);
    
    let [town,address,country,cntrycode,currency,qibla,cc,cntry3code]=cntryInfo
    let [current,future] = weather 
    let wikilinks= wikinder

    let [capital,population, bbox,bbox2,geonameId]= await cgetCountryInfo(cntrycode)
    .catch(error=> console.log("Error in geoname getCountryInfo API: ", error))
    
    /**-----------------------------INFO FROM API CALLS/-----------------------------*/


    let marker=L.marker({lat,lng});
    layer.push(marker);
    if (firstCall==true) {
        console.log(cntryInfo)
        marker.bindPopup("You are currently located in: \n"+town+", "+country).openPopup().addTo(map);
        const x= L.circle({lat,lng}, radius)
        x.addTo(map);
        layer.push(x)
    }
    else{
        marker.bindPopup("Capital City: "+ capital).openPopup().addTo(map);
    }


    /**-----------------------------SIDE MENU CONTENT-----------------------------*/
    let counter;
    [country,counter]=toDisplay("Country: ", country,`./lib/images/country.png`,counter=-1);
    [capital,counter]=toDisplay("Capital City: ", capital,`./lib/images/capital_city.png`,counter);
    [population,counter]=toDisplay("Population size: ",population,`./lib/images/pop_size.png`,counter);
    [current,counter]=toDisplay("Current weather: ",`temp:${current[0]} <br> summary:${current[1]}`,`./lib/images/weather2.png`,counter);
    let futurelst=[];

    let i=0;
    for (let index of future){
        Object.entries(index).forEach(([key, value]) => {
            futurelst.push(`
            <p>Date:${key} <br> Temperature:${value[0]} <br> Description:${value[1]}</p>`)
        });
    }
    futurelst=futurelst.join("\n");

    [futurelst,counter]=toDisplay("Weather Forecast for next 3 days: ",futurelst,"lib/images/weather2.png",counter)

    let htmlwikilinks=[]
    for (let wikilink of wikilinks) {
        htmlwikilinks.push(`<a href="${wikilink[1]}" target="_blank">${wikilink[0]}</a><br>`)
    }
    htmlwikilinks=htmlwikilinks.join("\n");

    
    [htmlwikilinks,counter]=toDisplay("Wikilinks",htmlwikilinks,`./lib/images/link.png`,counter)
    let fcurrency;
    [fcurrency,counter]=toDisplay("Currency: ", `Name: ${currency.name}</br>Symbol: ${currency.symbol}`,"./lib/images/currency.png",counter);
    [qibla,counter]=toDisplay("Direction to qibla: ", `${qibla} degrees from North`,"./lib/images/qibla.png",counter);
    [cc,counter]=toDisplay("Calling Code: ", `+${cc}`,`./lib/images/callingcode.png`,counter);
    
    let fullcontent=country+capital+population+current+futurelst+htmlwikilinks+fcurrency+qibla+cc;
    /**-----------------------------SIDE MENU CONTENT/-----------------------------*/



    /**-----------------------------ADDING POI MARKERS-----------------------------*/
    let POIs=["airport","library","cinema","hospital"]
    console.log("starting-poiFinder")
    // for (let POI of POIs){
    //     poiFinder(bbox2,cntry3code,POI)
    // }
    let markersAdded=true
    try{
        await Promise.all(
            // [poiFinder(bbox2,cntry3code,"airport")]// For testing
            [poiFinder(bbox2,cntry3code,"airport"),poiFinder(bbox2,cntry3code,"library"),poiFinder(bbox2,cntry3code,"cinema"),poiFinder(bbox2,cntry3code,"hospital")]
            )
    }
    catch(error){
        console.log("poiFinder Error: ",error)
        markersAdded=false;
    }

    /**-----------------------------ADDING POI MARKERS/-----------------------------*/

    /**-----------------------------ADDING POI MARKERS2 (INCOMPLETE)-----------------------------*/
    // let childrenId= await cchildren(geonameId)
    // console.log(childrenId)
    // throw ""
    /**-----------------------------ADDING POI MARKERS2 (INCOMPLETE)/-----------------------------*/

    /**-----------------------------LAYER PLUGIN (NOT IN USE)-----------------------------*/
    let overlayMaps = {
        // <img src='./lib/images/airport.png' /> 
        "Airport": POIlayer[0],
        "Library": POIlayer[1],
        "Cinema": POIlayer[2],
        "Hospital": POIlayer[3]
    };
    // featureControl = L.control.layers(null, overlayMaps,{position:"bottomright",interactive:false})
    // featureControl.addTo(map);

    /**-----------------------------LAYER PLUGIN (NOT IN USE)/-----------------------------*/



    /**-----------------------------DISPLAY SIDE MENU-----------------------------*/
    try{
        if (firstCall==true) {
            if (window.innerWidth < 650){
                console.log("SMALLER SCREEN!!!!!!!!!!!!!!!!!")
                menudata = L.control.slideMenu(fullcontent,{position: "topright",
                menuposition: "topright",
                width: "100%",
                height: "100%",
                delay: "10",
            }).addTo(map);
            }
            else {
                menudata = L.control.slideMenu(fullcontent,{position: "topright",
                menuposition: "topright",
                width: "30%",
                height: "100%",
                delay: "10",
            }).addTo(map)
            }
        }
        else {
            menudata.setContents(fullcontent);
        }
        }
    catch(e){
        console.log(e);
    };
    loader("off")
    /**-----------------------------DISPLAY SIDE MENU/-----------------------------*/
    


    /**-----------------------------DISPLAY COUNTRY BORDER-----------------------------*/
    let selborder;
    for (let feature of border.features){
        if (feature.id==cntry3code){
            selborder=feature
        }
    }

    selborder=L.geoJSON(selborder)
    layer.push(selborder)
    selborder.addTo(map);
    /**-----------------------------DISPLAY COUNTRY BORDER/-----------------------------*/

}
function onLocationFound(e){
    let lat=e.latlng.lat;
    let lng=e.latlng.lng;
    let radius=e.accuracy;
    main(lat,lng,radius)
}
map.on('locationfound', onLocationFound);


const submit= document.getElementById("submit");
const myInput= document.getElementById("myInput");

submit.addEventListener('click', () => {
    fetch(`https://restcountries.com/v3.1/name/${myInput.value}`)
    .then(resp=>{
        return resp.json();
    })
    .then(json=>{
        console.log("Response from rest countries API: ",json);
        // let capital=json[0].capital[0];
        let lat=json[0].capitalInfo.latlng[0];
        let lng=json[0].capitalInfo.latlng[1];
        main(lat,lng,"",false);
    })
    .catch((error)=>console.log("Error from restcountriesAPI: ",error))
    for (let x=0;x<layer.length;x++){
        map.removeLayer(layer[x]);
    }
    for (let layer of POIlayer){
        layer.clearLayers()
    }
    POIlayer=[]
    layer=[]
})


