

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { useState , useEffect} from "react";


//import {Picker} from '@react-native-community/picker';
import {Picker} from  '@react-native-picker/picker';
//import RNPickerSelect from 'react-native-picker-select';


async function GetAllCameras() {
  try {
  let response = await fetch(
  'https://tie.digitraffic.fi/api/v1/data/camera-data',
  );
  let responseJson = await response.json();
  console.log(responseJson);
  return responseJson;
  } catch (error) {
  console.error(error);
  }
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
    let name = element.properties.name
    let mun = element.properties.municipality
    let province = element.properties.municipality
    let x = element.geometry.coordinates[0]
    let y = element.geometry.coordinates[1]
    cameras.push({name: name + ", " + mun + ", " + province, id: id})
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
    //console.log(responseJson);


    return responseJson;
    } catch (error) {
    console.error(error);
    }
  
}

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedValue, setSelectedValue] = useState("java");
  const [locations, setLocations] = useState([{id: "0", name: "loading"}])
  const [initialized, setInitialized] = useState(false);
  //ei välttis tarvii, alemmasta saa myös id:t
  //getCameras()


  useEffect(() => {
    async function initialize() {
      let cameras =  await getCameraLocations()
      setLocations(cameras)
    }
    initialize()
 }, [])

  /*
  if (!initialized) {
    let cameras =  await getCameraLocations()

    
    //setLocations(cameras)
    console.log("ok")
    setInitialized(true)
  }
  */

  return (
    <SafeAreaView >

      <View style={{flex: 1, alignSelf:"center", marginTop: "5%", justifyContent:"space-around", flexDirection:"row"}}>

      <Picker
        selectedValue={selectedValue}
        style={{height: 50, width: 100}}
        onValueChange={(itemValue, itemIndex) =>
          setSelectedValue(itemValue)
        }>
        {locations.map((item, index) => {
            return <Picker.Item value={item.id} label={item.name} key={index} />
        })
        }
      </Picker>


      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
/*
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />

*/