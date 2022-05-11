//flags from https://github.com/google/region-flags/

//TODO: location refresh doesnt reorder list

import React, { useRef } from 'react';
import {
  Alert,
  PermissionsAndroid,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  FlatList,
  Image,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  BackHandler,
  Linking
} from 'react-native';
import { useState , useEffect} from "react";

import openMap from 'react-native-open-maps';

//import Geolocation from '@react-native-community/geolocation';

import RNLocation from 'react-native-location';

//import {Picker} from '@react-native-community/picker';
import {Picker} from  '@react-native-picker/picker';
//import RNPickerSelect from 'react-native-picker-select';


import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

 //';
import { Button, Text } from 'react-native-paper';
//import { Item } from 'react-native-paper/lib/typescript/components/Drawer/Drawer';


import AsyncStorage from '@react-native-async-storage/async-storage';


import './assets/i18n/i18n';
import {useTranslation} from 'react-i18next';

RNLocation.configure({ 
  distanceFilter: 0,
  //desiredAccuracy: {"android": "lowPower"}

});

const getItemColor = (dist, max) => {
  let percent = dist/max * 100

  let r = 0
  let g = 0
  if (percent < 50) {
    g = 225
    r = 225*percent/100 * 2
  }
  else {
    r = 225
    g = 225 - (225 * (percent-50)/100 *2);
  }
  //255
  //const r = 225 * percent/100;
  //const g = 225 - (225 * percent/100);
  return 'rgb('+r+','+g+',0)';
}


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}



async function getCameraLocations() {
  try {
  let response = await fetch(
  'https://tie.digitraffic.fi/api/v1/metadata/camera-stations',
  );
  let responseJson = await response.json();

  let cameras = []
  responseJson.features.forEach(element => {
    let id = element.properties.id
    let weather = element.properties.nearestWeatherStationId
    let nameFi = element.properties.names.fi
    let nameEn = element.properties.names.en
    if (nameEn == null) {
      nameEn = "<Name not found>"
    }
    if (nameFi == null) {
      nameFi = "<Nimeä ei löydy>"
    }
    let mun = element.properties.municipality
    let city = element.properties.municipality
    let y = element.geometry.coordinates[0]
    let x = element.geometry.coordinates[1]
    let distance = 0
    let status = element.properties.collectionStatus
    if (status == "GATHERING") {
      cameras.push({nameFi: nameFi + ", " + mun , nameEn:nameEn +", " + mun,  id: id, lat: x, lon:y, city:city, distance: distance, weather: weather})

    }
  });


  return cameras;
  } catch (error) {
  console.error(error);
  }
}

async function getCameraData(id:string) {

  try {
    let response = await fetch(
    'https://tie.digitraffic.fi/api/v1/data/camera-data/'+id,
    );
    let responseJson = await response.json();
    let result = []

    responseJson.cameraStations[0].cameraPresets.forEach((val, index) => {
      result.push({"label": val.presentationName, value: val.imageUrl, index: index})
    });


    return result;
    } catch (error) {
    console.error(error);
    }
  
}

async function getTemperatureAndHumidity(id: string) {
  try {
    let response = await fetch(
      "https://tie.digitraffic.fi/api/v1/data/weather-data/" + id,
    );
    let responseJson = await response.json();
    let temp = ""
    let temp2 = ""
    let hum = ""
    Object.keys(responseJson.weatherStations[0].sensorValues).forEach(elem => {
      let name = responseJson.weatherStations[0].sensorValues[elem].name
      if (name == "ILMA") {
        temp = responseJson.weatherStations[0].sensorValues[elem].sensorValue
      }
      if (name == "TIE_1") {
        temp2 = responseJson.weatherStations[0].sensorValues[elem].sensorValue

      }
      else if (name == "ILMAN_KOSTEUS") {
        hum = responseJson.weatherStations[0].sensorValues[elem].sensorValue
      }
    })
    let result = [temp, temp2, hum] //responseJson.weatherStations[0].sensorValues[0].sensorValue


    return result;
    } catch (error) {
    console.error(error);
    return []
    }

}


async function saveLanguage(language) {
  try {
    await AsyncStorage.setItem(
      '@language',
      language
    );
  } catch (error) {
    // Error saving data
  }
};

async function getLanguage() {
    try {
      const value = await AsyncStorage.getItem('@language')
      if(value !== null) {
        return value
      }
      else {
        return ""
      }
    } catch(e) {
      // error reading value
      return ""
    }
}


const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedValue, setSelectedValue] = useState("java");
  const [locations, setLocations] = useState([{id: "0", nameFi: "loading", nameEn: "loading", city:"none", distance:0, lat:0, lon:0}])
  const [filteredLocations, setFilteredLocations] = useState([{id: "0", nameFi: "loading", nameEn: "loading", city:"none", distance:0, lat:0, lon:0}])
  const [cameraButtons, setCameraButtons] = useState([{label: "loading", value: "", index:0}])
  const [initialized, setInitialized] = useState(false);
  const [imageUri, setImageUri] = useState("") //https://i.kym-cdn.com/entries/icons/facebook/000/026/981/0bd0ed742059cd7f4c83882095aeb3752e45dfbfv2_hq.jpg
  const [filterText, setFilterText] = useState("")
  const [lat, setLat] = useState(0.0)
  const [lon, setLon] = useState(0.0)
  const [sortMode, setSortMode] = useState("distance")
  const [cameraLocation, setCameraLocation] = useState({lat:0, lon:0})
  const [maxDistance, setMaxDistance] = useState(100)
  const [buttonIndex, setButtonIndex] = useState(0)
  const [reverse, setReverse] = useState(false)
  const [view, setView] = useState("main")
  const [language, setLanguage] = useState("fi")
  const [touchX, setTouchX] = useState(0)
  const [touchY, setTouchY] = useState(0)
  const [temperature, setTemperature] = useState("")
  const [temp2, setTemp2] = useState("")

  const [humidity, setHumidity] = useState("")
  const [lastFilterModTime, setLastFilterModTime] = useState(new Date())
  const timeoutRef = React.useRef(null);

  const {t, i18n} = useTranslation();
  

  function reloadFirstCamera() {
    if (filteredLocations.length > 0) {
      let camera = filteredLocations[0]
      loadInitial(camera.id, camera.lat, camera.lon, camera.weather)
    }
  }

  React.useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
     
    timeoutRef.current = setTimeout(()=> {
      timeoutRef.current = null;
      //filterText !== '' ? reloadFirstCamera() : null;
      reloadFirstCamera()
    },2000);
  },[filterText]);
  
  const changeLanguage = value => {
    i18n
      .changeLanguage(value)
      .then(() => {
        setLanguage(value)
        filterChange("")
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    const backAction = () => {
      

      if (view != "main") {
        setView("main")
        return true;
      }
      else {
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [view]);

  useEffect(()=> {
    (async () => {
        let lang = await getLanguage()
        if (lang != "") {
          //setLanguage(lang)
          changeLanguage(lang)

        }
        else {
          changeLanguage("fi")
          saveLanguage("fi")

        }

        
        let cameras =  await getCameraLocations()
        let sortedCameras = []
        let location = await getLocation()
        if (location.length === 2) {
          setLat(location[0])
          setLon(location[1])

          cameras.forEach(l => {
            l.distance = getDistanceFromLatLonInKm(location[0], location[1], l.lat, l.lon)
          })
          sortedCameras = sortByDistance(location[0], location[1], cameras)//sortByDistance(location[0], location[1], cameras)

          setMaxDistance(sortedCameras[sortedCameras.length -1].distance)
          setSortMode("distance")
        }
        else {
          setLat(0)
          setLon(0)


          cameras.forEach(l => {
            l.distance = 0
          })
          setMaxDistance(100)

          sortedCameras = sortByCity(cameras)//sortByDistance(location[0], location[1], cameras)
          setSortMode("abc")

        }
        setLocations(sortedCameras)
        setFilteredLocations(sortedCameras)

        loadInitial(sortedCameras[0].id, sortedCameras[0].lat, sortedCameras[0].lon, sortedCameras[0].weather)

    })()
  }, []);

 const getLocation = async() => {

  let ok = await RNLocation.requestPermission({
                  ios: "whenInUse",
                  android: {
                    detail: "coarse"}})

  if (ok) {
    let loc = await RNLocation.getLatestLocation({ timeout: 6000 })
    if (loc != null) {
      let lat1 = loc.latitude
      let lon1 = loc.longitude
      return [lat1, lon1]
    }
    else {
      return []
    }
  }
  else {
    return []
  }

    



 }

 const loadInitial = async(id:string, latitude:number, lognitude:number, weather:string) => {
  //setSelectedValue(itemValue)
  let buttons = await getCameraData(id)
  setCameraLocation({lat: latitude, lon:lognitude})

  setCameraButtons(buttons)

  setImageUri(buttons[0].value)
  setButtonIndex(0)
  let weatherData = await getTemperatureAndHumidity(weather)
  if (weatherData.length != 0) {
    setTemperature(weatherData[0])
    setTemp2(weatherData[1])
    setHumidity(weatherData[2])
  }

}

 const loadButtons = async(itemValue:string, itemIndex:number) => {
    //console.log(filteredLocations[itemIndex])
    setSelectedValue(itemValue)

    let buttons = await getCameraData(itemValue)
    let latitude = filteredLocations[itemIndex].lat
    let lognitude = filteredLocations[itemIndex].lon
    setCameraLocation({lat: latitude, lon:lognitude})

    setCameraButtons(buttons)

    setImageUri(buttons[0].value)
    setButtonIndex(0)

    let weatherData = await getTemperatureAndHumidity(filteredLocations[itemIndex].weather)
    if (weatherData.length != 0) {
      setTemperature(weatherData[0])
      setTemp2(weatherData[1])
      setHumidity(weatherData[2])
    }
  

 }

 const sortByDistance = (latitude, longitude, locs) => {

  let sortedLocs = locs

  sortedLocs.sort( function(a, b) { 

    //const aDist = Math.sqrt( Math.pow(a.lat - latitude, 2) + Math.pow(a.lon - longitude, 2))
    //const bDist = Math.sqrt( Math.pow(b.lat - latitude, 2) + Math.pow(b.lon - longitude, 2))
    return a.distance > b.distance
    /*
    if (aDist > bDist) {
      return 1
    }
    if (aDist < bDist) {
      return -1
    }
    else {
      return 0
    }
    */
    
  })

  return sortedLocs
  //setLocations(sortedLocs)
  //filterChange(filterText)

 }

 const sortByCity = (locs) => {
  let sortedLocs = locs
  sortedLocs.sort( function(a, b) { 

    const aCity = a.city.toLowerCase()
    const bCity = b.city.toLowerCase()

    
    return aCity > bCity;
  })
  return sortedLocs
 }


 const sort = (method:string) => {
   let sortedLocs = locations;
   if (method == "abc" && sortMode != method) {
      setReverse(false)
      sortedLocs = sortByCity(sortedLocs)
   }
   else if (method == "distance" && sortMode != method) {
      sortedLocs = sortByDistance(lat, lon, sortedLocs)
      setReverse(false)
    }

    else {
      sortedLocs = sortedLocs.reverse()
      setReverse(!reverse)
     }
   setSortMode(method)
   setLocations(sortedLocs)
   filterChange(filterText)

   loadInitial(sortedLocs[0].id, sortedLocs[0].lat, sortedLocs[0].lon)

 }

 const imageButton = async(item) => {

  const url = item.value
  setImageUri(url)
  setButtonIndex(item.index)
 }



 /*
 const triggerDelayedButtonLoad = async(date:Date, filterModTime:Date) => {
   console.log(date, filterModTime)
  if (date == filterModTime && filteredLocations.length > 0) {
    let camera = filteredLocations[0]
    loadInitial(camera.id, camera.lat, camera.lon, camera.weather)
    console.log("LOAD")
  }
  else {
    console.log("NOPE")
  }
 }

 const delayedButtonLoad = async() => {
   const current = new Date() 
   console.log("SET: ", current)
   setLastFilterModTime(current)
   const modTimeRef = useRef(lastFilterModTime);
   modTimeRef.current = lastFilterModTime;
   setTimeout(function() { triggerDelayedButtonLoad(current, modTimeRef.current); }, 5000);

 }
 */

 const filterChange = async(text:string) => {
   setFilterText(text)
   let filtered = []
   locations.forEach(location => {
     if (language == "fi") {

      if (location.nameFi.toLowerCase().includes(text.toLowerCase())) {
        filtered.push(location)
      }
     }
     else if (language == "en") {
      if (location.nameEn.toLowerCase().includes(text.toLowerCase())) {
        filtered.push(location)
      }
     }

   })
   setFilteredLocations(filtered)
   //delayedButtonLoad()

 }

 const clearFilter = async() => {
   filterChange("")
 }

 const refreshLocation = async() => {
    const location = await getLocation();
    if (location.length === 2) {
      setLat(location[0])
      setLon(location[1])
      locations.forEach(l => {
        l.distance = getDistanceFromLatLonInKm(location[0], location[1], l.lat, l.lon)
      })

      setMaxDistance(locations[locations.length -1].distance)
      

      locations.forEach(l => {
        l.distance = getDistanceFromLatLonInKm(location[0], location[1], l.lat, l.lon)
      })
      let sorted = sortByDistance(location[0], location[1],locations )//sortByDistance(location[0], location[1], cameras)
      setLocations(sorted)
      setFilteredLocations(sorted)
      setFilterText("")
      setSortMode("distance")

    }
    else {
      Alert.alert(t("nogps"))
    }
  
 }
 const showMap = (latitude: number, longitude: number) => {
  openMap({ latitude:latitude, longitude: longitude });
 }

 const pickLanguage = async(lang:string) => {

  setLanguage(lang)
  await saveLanguage(lang)

  changeLanguage(lang)

  setView("main")

 }

 const swipe = async(direction:number) => {
   let index = buttonIndex
   if (direction > 0) {
     console.log("left")
     index += 1
   }
   else {
     console.log("right")
     index -= 1
   }
   if (index >= 0 && index < cameraButtons.length) {
     let item = cameraButtons[index]
      const url = item.value
      setImageUri(url)
      setButtonIndex(item.index)
  
   }
 }

  if (view == "main")
  {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1,  marginTop: "0%", justifyContent:"flex-start"}}>
          <View style={{flexDirection:"row", justifyContent:'space-between'}}>
  
          <View style={{flexDirection: "row"}}>
            <Text style={styles.infoText}>{t("currentlocation")}: {lat.toFixed(5)}, {lon.toFixed(5)} </Text>


            <TouchableOpacity onPress={() => showMap(lat, lon)}>

              <MaterialCommunityIcon name="google-maps" size={40} color="#f00"   />
            </TouchableOpacity>

            <Text> </Text>



            <TouchableOpacity onPress={() => refreshLocation()}>
              <MaterialIcon name="refresh" size={40} color="#0f0"  />
            </TouchableOpacity>

          </View>

          <View style={{width: 40, height: 40,  marginRight: "0%"}}>
          <TouchableOpacity onPress={() => setView("settings")} >
              <MaterialIcon name="settings" size={40} color="#aaa"/>
            </TouchableOpacity>


          </View>

        </View>

          <View style={{flexDirection:"row", justifyContent:"flex-start"}}>
            <Text style={styles.infoText}>{t('sort')}: </Text>
            <Button
              mode="contained"
              color={sortMode == "distance" ? ACTIVEBUTTONCOLOR : BUTTONCOLOR}
  
              style={styles.button}
              onPress={() => sort("distance")} >
              <Text style={styles.buttonText}>{t('distance')}</Text> 
              {
               sortMode == "distance" ? <Text style={styles.buttonText}>{!reverse ? "\u2191": "\u2193"}</Text> : null
              }
            </Button>
  
            <Text> </Text>
  
  
            <Button
              mode="contained"
              color={sortMode == "abc" ? ACTIVEBUTTONCOLOR : BUTTONCOLOR}
  
              style={styles.button}
              onPress={() => sort("abc")}>
              <Text style={styles.buttonText}>{t('cityname')}</Text>
              {
                sortMode == "abc" ? <Text style={styles.buttonText}>{!reverse ? "\u2191": "\u2193"}</Text> : null
              }
            </Button>
  
  
          </View>
  
          <View style={{flexDirection:"row", justifyContent:"space-around"}}>
            <TextInput
              onChangeText={filterChange}
              value={filterText}
              placeholder={t("filter")}
              style={{width:"80%"}}
              underlineColorAndroid={'grey'}

              ></TextInput>
  
  
            <TouchableOpacity onPress={() => clearFilter()}>
  
            <MaterialIcon name="clear" size={40} color="#f00"  />
  
            </TouchableOpacity>
  

    
  
          </View>

        <View style={{borderWidth: 1, borderRadius: 10, borderColor: "grey" }}>
        <Picker
        selectedValue={selectedValue}
        style={{width: "100%", }}
        onValueChange={loadButtons}
        >
        {filteredLocations.map((item, index) => {
          //nameFi tai nameEn
          let name = ""
          if (language == "fi") {
            name = item.nameFi
          }
          else {
            name = item.nameEn
          }
            return <Picker.Item value={item.id} color={getItemColor(item.distance, maxDistance)} label={ name + ", "+item.distance.toFixed(1).toString() + "km"} key={index} >
              </Picker.Item>
        })
        }
        </Picker>


        </View>
  
        <View style={{flexDirection:"row", justifyContent:"flex-start"}}>
  
          <Text style={styles.infoText}>{t("cameralocation")}: {cameraLocation.lat.toFixed(5)}, {cameraLocation.lon.toFixed(5)}</Text>

          <TouchableOpacity onPress={() => showMap(cameraLocation.lat, cameraLocation.lon)}>
            <MaterialCommunityIcon name="google-maps" size={40} color="#f00"  />
          </TouchableOpacity>
        </View>
        <Text style={styles.infoText}>{t("temperature")}: {t("air")}: {temperature} {"°C"}; {t("roadsurface")}: {temp2} {"°C"}</Text>
        <Text style={styles.infoText}>{t("humidity")}: {humidity} {"%"}</Text>
        <Text></Text>

        <SafeAreaView style={{flex: 1,  height: 4500, maxHeight: 50, width: "100%"}}>
        <FlatList
            horizontal={true}
                data={
                cameraButtons
                }
                renderItem={({item}) => 
                
  
  
                <Button
                mode="contained"
                color={
                  item.index == buttonIndex ? ACTIVEBUTTONCOLOR : BUTTONCOLOR
                }
    
                style={styles.button}
                onPress={() => imageButton(item)} 
                >
               <Text style={styles.buttonText}>{item.label} </Text>
              </Button>
    
                
                }/>
        </SafeAreaView>
  

        <View
            onTouchStart={(e)=> {
              setTouchX(e.nativeEvent.pageX)
              setTouchY(e.nativeEvent.pageY)
              }
            }
            onTouchEnd={(e) => {
              if (Math.abs(touchX - e.nativeEvent.pageX) > 20 &&  Math.abs(touchY - e.nativeEvent.pageY) < 30) {
                swipe(touchX - e.nativeEvent.pageX )
              }
            }}
            style={{flex:1, flexDirection: "column", alignItems:"flex-start"}}
        >
        <Text style={{alignSelf: "center", color: "grey"}}>{t("swipe")}</Text>

        <Image
                style={{width: "100%", height: "100%", alignSelf: "flex-start"}}
                source={{uri: imageUri}}
              />


        </View>
  

        </View>
  
      </SafeAreaView>
    );

  }
  else if (view == "settings"){
    return (

      <SafeAreaView style={styles.safeArea}>
        <View style={{marginTop: "30%", height: "100%"}}>
          <Text style={{alignSelf: "center"}}>{t("chooselanguage")} {"\n"}
          
          </Text>
          <View style={{flex:1, flexDirection:"row", height: "100%", justifyContent: "space-around"}}>

          <TouchableOpacity onPress={() => pickLanguage("en")}>
            
            <Text style={{alignSelf: "center"}}>English</Text>
            <Image style={{width: 100, height: 61}} source={require('./assets/i18n/GB.png')} />

          </TouchableOpacity>

          <TouchableOpacity onPress={() => pickLanguage("fi")}>
            <Text style={{alignSelf: "center"}}>Suomi</Text>
            <Image style={{width: 100, height: 61}} source={require('./assets/i18n/FI.png')} />

          </TouchableOpacity>

          </View>
          
          <View style={{flex:1}}>
            <Text style={{alignSelf: "center"}}>
              {t("license")}
              <TouchableOpacity onPress={() => Linking.openURL('https://choosealicense.com/licenses/mit/')}>
                <Text style={{color: 'blue'}}> MIT </Text>
              </TouchableOpacity>
              
            </Text>
            <Text style={{alignSelf: "center"}}>
              {t("repo")} 
              <TouchableOpacity onPress={() => Linking.openURL('https://github.com/MilanFIN/react-kelikamera')}>
                <Text style={{color: 'blue'}}> GITHUB </Text>
              </TouchableOpacity>

            </Text>
          </View>
        </View>
      </SafeAreaView>
  
    )

  }
  else {
    return (
      <SafeAreaView style={styles.safeArea}>
      </SafeAreaView>
  
    )

  }

};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    //width: 50,
    height: 45,
    justifyContent: 'center',

  },
  buttonText:
  {
    color:"#ffffff",
    textAlign: "center"
  },
  safeArea: {
    flex:1, 
    flexDirection:"column",
    backgroundColor: "#eaeaea",
  },
  infoText: {
    marginLeft:"1%",
    textAlignVertical: "center"
  }
});

const BUTTONCOLOR = "#6666FF"
const ACTIVEBUTTONCOLOR = "#4444DD"


export default App;
