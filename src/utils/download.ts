// 예: store 또는 utils 안
import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import axios from 'axios';

const API_URL = 'http://192.168.0.42:3060'; // 서버 주소

function sanitizeLabel(s: string) {
    // 한글/영문/숫자/공백/.-/_ 만 허용
    return (s ?? '').replace(/[^\w\s.\-가-힣_]/g, '_').trim();
}

// 파일명에서 날짜/시간 부분 뽑기:
// '누렁이_tailing_1999_05_24_12_01_36.csv' -> '1999_05_24_12_01_36'
// function extractDateTimeFromFilename(file_name: string) {
//     const dot = file_name.lastIndexOf('.');
//     const base = dot >= 0 ? file_name.slice(0, dot) : file_name; // 확장자 제거
//     const parts = base.split('_'); // ["누렁이","tailing","1999","05","24","12","01","36"]
//     if (parts.length > 1) parts.splice(1, 1); // 2번째 조각(tailing) 제거
//     // 맨 앞(동물이름/라벨) 제외 나머지를 날짜조각으로 사용
//     const dateParts = parts.slice(1);
//     return dateParts.length ? dateParts.join('_') : 'unknown';
// }

export const downCSV = async (file_name: string, label: string) => {
    try {
        // 로딩 상태 set({ downCsvLoading: true, ... }) 등은 너의 스토어에서 처리
        const extIndex = file_name.lastIndexOf('.');
        const ext = extIndex !== -1 ? file_name.substring(extIndex) : '.csv';
        console.log("ext", ext)
        const safeLabel = sanitizeLabel(label) || 'data';
        // const date_time = extractDateTimeFromFilename(file_name); // YYYY_MM_DD[_hh_mm_ss]
        const baseFileName = `${safeLabel}${ext}`;
        // 1) 서버에서 CSV 텍스트 가져오기
        const response = await axios({
            url: `${API_URL}/data/downloadCSV`,
            method: 'POST',
            data: { filename: file_name },
            responseType: 'text',
        });

        let finalPath = '';

        if (Platform.OS === 'android') {
            // Android 9 이하 권한(필요 시)
            if (Platform.Version <= 28) {
                const ok = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                );
                if (ok !== PermissionsAndroid.RESULTS.GRANTED) {
                    throw new Error('저장소 권한이 필요합니다.');
                }
            }

            const baseDir = RNFS.DownloadDirectoryPath; // /storage/emulated/0/Download
            finalPath = `${baseDir}/${baseFileName}`;
            let count = 1;

            // 같은 파일명 있으면 (1), (2) …
            while (await RNFS.exists(finalPath)) {
                const nameNoExt = baseFileName.slice(0, -ext.length);
                finalPath = `${baseDir}/${nameNoExt}(${count})${ext}`;
                count++;
            }

            await RNFS.writeFile(finalPath, response.data, 'utf8'); // CSV 텍스트 저장
        } else {
            // iOS: Documents에 저장 후 공유 시트로 내보내기(필요 시)
            const tempPath = `${RNFS.DocumentDirectoryPath}/${baseFileName}`;
            await RNFS.writeFile(tempPath, response.data, 'utf8');

            await Share.open({
                url: 'file://' + tempPath,
                type: 'text/csv',
                filename: baseFileName,
                failOnCancel: false,
            });

            finalPath = tempPath;
        }

        // 성공 상태 set({ downCsvSuccess: true, ... }) 등은 너의 스토어에서 처리
        return finalPath;
    } catch (error) {
        // 에러 상태 set({ downCsvError: ..., ... }) 등은 너의 스토어에서 처리
        throw error;
    }
};
