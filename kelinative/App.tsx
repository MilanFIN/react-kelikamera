

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
import { useState } from "react";


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


  console.log(cameras.length)


  return responseJson;
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
  //ei välttis tarvii, alemmasta saa myös id:t
  //getCameras()
  let cameras = getCameraLocations()

  return (
    <SafeAreaView >

      <View style={{flex: 1, alignSelf:"center", marginTop: "5%", justifyContent:"space-around", flexDirection:"row"}}>

      <Picker
        selectedValue={selectedValue}
        style={{height: 50, width: 100}}
        onValueChange={(itemValue, itemIndex) =>
          setSelectedValue(itemValue)
        }>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
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

      <Picker
        selectedValue={selectedValue}
        style={{ height: 50, width: 150 }}
        onValueChange={(itemValue, itemIndex) => setSelectedValue(itemValue)}
      >
        <Picker.Item label="first" value="1" />
        <Picker.Item label="second" value="2" />
      </Picker>


      <Picker
        selectedValue={selectedValue}
        style={{height: 50, width: 100}}
        onValueChange={(itemValue, itemIndex) =>
          setSelectedValue(itemValue)
        }>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
      </Picker>


        <RNPickerSelect
            onValueChange={(value) => setSelectedValue(value)}
            items={[
                { label: 'Football', value: 'football' },
                { label: 'Baseball', value: 'baseball' },
                { label: 'Hockey', value: 'hockey' },
            ]}
        />

*/