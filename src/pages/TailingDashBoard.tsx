import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import TailingDeviceMonitor from "./TailingDeviceMonitor";
import TailingDetailTemp from "./TailingDetailTemp";
import { useRoute } from "@react-navigation/native";

const TailingDashBoard = () => {
    const [selectedView, setSelectedView] = useState('heart');

    return (
        <SafeAreaView style={styles.portrait_container}>
            <SafeAreaView style={styles.btn_container}>
                <TouchableOpacity
                    style={[styles.view_button, selectedView === 'heart' && styles.selected_button]}
                    onPress={() => setSelectedView('heart')}
                >
                    <Text style={[styles.button_text, selectedView === 'heart' && styles.selected_button_text]}>hr</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.view_button, selectedView === 'temp' && styles.selected_button]}
                    onPress={() => setSelectedView('temp')}
                >
                    <Text style={[styles.button_text, selectedView === 'temp' && styles.selected_button_text]}>temp</Text>
                </TouchableOpacity>
            </SafeAreaView>
            {selectedView === 'heart' && <TailingDeviceMonitor />}
            {selectedView === 'temp' && <TailingDetailTemp />}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    portrait_container: {
        width: "100%",
        height: "auto",
    },
    landscape_container: {
        width: "100%",
        height: "auto",
    },
    btn_container: {
        width: 166,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
        marginLeft: 'auto',
        marginTop: 20
    },
    bat_box: {
        width: 44.68,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    view_button: {
        width: 50,
        height: 20,
        borderRadius: 4,
        backgroundColor: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selected_button: {
        backgroundColor: '#F5B75C',
    },
    button_text: {
        fontSize: 12,
        color: '#666666',
    },
    selected_button_text: {
        color: '#FFFFFF',
    },
    chart_container: {
        width: '100%',
    },
    split_chart_container: {
        flexDirection: 'row',
        width: '100%',
        height: 270,
        alignSelf: "center",
        marginLeft: "0.5%",
    },
    half_chart: {
        width: '49%',
        height: 270,
        alignSelf: "center",
    },
    icon_img: {
        width: '100%',
        height: '100%',
    },
    icon_blink: {
        opacity: 0.2,
    },
});

export default TailingDashBoard;