import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.0.42:3060', // ⚠️ 서버 주소로 교체하세요
    // timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;