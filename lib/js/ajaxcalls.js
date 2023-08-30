// import {map} from "./main.js"

function astergdem(lat,lng){
    $.ajax({
        // Information need to make request
        url: "lib/php/astergdem.php",
        type: 'GET',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng,   
        },

        // Processing resolved request
        success: function(result) {
            console.log(`Elevation above sea: ${result.data}`)
        },
        error: function(jqXHR, textStatus, errorMessage) {
            // your error code
            console.log(errorMessage)
        }
    }); 
}

function geocode(query){
    return $.ajax({
      url: 'https://api.opencagedata.com/geocode/v1/json',
      method: 'GET',
      data: {
        'key': '7b988e14d5e84cd9b56bd635cc27a7b7',
        'q': query,
        // 'no_annotations': 1
        // see other optional params:
        // https://opencagedata.com/api#forward-opt
      },
      statusCode: {
        // 200: function(response){  // success
        // },
        401: function(){
          console.log('invalid API key');
        },
        402: function(){
          console.log('hit free trial daily limit');
          console.log('become a customer: https://opencagedata.com/pricing');
        }
        // other possible response codes:
        // https://opencagedata.com/api#codes
      }
    })
  }

function getCountryInfo(country,language="en"){
  return(
    $.ajax({
    // Information need to make request
    url: "lib/php/countryInfo.php",
    type: 'GET',
    dataType: 'json',
    data: {
      country: country,
      language: language,   
    },

    // Processing resolved request
    success: function(result) {
    },
    error: function(jqXHR, textStatus, errorMessage) {
        // your error code
        console.log(errorMessage)
    }
}) 
);
}

function getWeather(lat,lng){
  return $.ajax({
    url: `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=minutely,hourly,alerts&units=metric&appid=a72de247fbde433638c48e449a5fca16`,
    method: 'GET',
  })
}

function wikifinder(lat,lng){
  return(
    $.ajax({
    // Information need to make request
    url: "lib/php/findNearbyWikipedia.php",
    type: 'GET',
    dataType: 'json',
    data: {
      lat: lat,
      lng: lng,   
    },

    // Processing resolved request
    success: function(result) {
    },
    error: function(jqXHR, textStatus, errorMessage) {
        // your error code
        console.log(errorMessage)
    }
}) 
);
  // return $.ajax({
  //   url: `http://api.geonames.org/findNearbyWikipediaJSON?lat=${lat}&lng=${lng}&username=flightltd`,
  //   method: 'GET',
  // })
}

function getChildren(geonameId){
  return(
    $.ajax({
    // Information need to make request
    url: "lib/php/children.php",
    type: 'GET',
    dataType: 'json',
    data: {
      geonameId: geonameId, 
    },

    // Processing resolved request
    success: function(result) {
    },
    error: function(jqXHR, textStatus, errorMessage) {
        // your error code
        console.log(errorMessage)
    }
})
) 
}

export {astergdem, geocode,getCountryInfo,getWeather,wikifinder,getChildren};


// https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=2&lon=2&appid=a72de247fbde433638c48e449a5fca16