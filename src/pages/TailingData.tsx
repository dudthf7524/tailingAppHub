import React from "react";
import {SafeAreaView, StyleSheet, Text, View, Image} from "react-native";

interface Data {
  hrData: number | null;
  spo2Data: number | null;
  tempData: number | null;
}

interface DashboardDataProps {
  screen: string;
  data: Data;
}
const TailingData = ({screen, data}: DashboardDataProps ) => {
  return (
        <SafeAreaView style={styles.container}>
          <SafeAreaView style={styles.metrics_container}>
            <SafeAreaView style={styles.metric_box}>
              {/* <Image source={require("../assets/images/icon_hr.png")} style={styles.icon_img}/> */}
              {screen === 'LANDSCAPE' && <Text style={styles.icon_text}>심박수</Text>}
              <View style={styles.value_box}>
                <Text style={styles.value}>{data.hrData}</Text>
                <Text style={styles.unit}>BPM</Text>
              </View>
            </SafeAreaView>
            <SafeAreaView style={styles.metric_box}>
              {/* <Image source={require("../assets/images/icon_spo2.png")} style={styles.icon_img}/> */}
              {screen === 'LANDSCAPE' && <Text style={styles.icon_text}>산소포화도</Text>}
              <View style={styles.value_box}>
                <Text style={styles.value}>{data.spo2Data}</Text>
                <Text style={styles.unit}>%</Text>
              </View>
            </SafeAreaView>
            <SafeAreaView style={styles.metric_box}>
              {/* <Image source={require("../assets/images/icon_temp.png")} style={styles.icon_img}/> */}
              {screen === 'LANDSCAPE' && <Text style={styles.icon_text}>체온</Text>}
              <View style={styles.value_box}>
                <Text style={styles.value}>{data.tempData}</Text>
                <Text style={styles.unit}>°C</Text>
              </View>
            </SafeAreaView>
          </SafeAreaView>
        </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '95%',
    height: 'auto',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: '#F5B75C',
    paddingTop: 8,
    paddingBottom: 8,
    alignSelf: "center",
    
    marginTop: 10,
  },
  metrics_container: {
    width: "100%",
    height: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  metric_box: {
    width: '28%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon_img: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  icon_text: {
    fontSize: 16,
    fontWeight: '400',
  },
  value_box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  value: {
    fontSize: 20,
    fontWeight: '400',
    color: '#262626',
    lineHeight: 28,
    textAlign: 'right',
  },
  unit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7b7b7b',
    marginLeft: 4,
    marginRight:4
  },
})

export default TailingData;