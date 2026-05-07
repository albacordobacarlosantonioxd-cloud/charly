import axios from "axios";

const evogb = axios.create({
    baseURL: 'https://api.evogb.org/',
    timeout: 30000,
    proxy: {
        protocol: 'http',
        host: '92.113.242.158',
        port: 6742,
        auth: {
            username: 'iqnwmiiv',
            password: '9192omub9qkt'
        }
    },
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://api.evogb.org/'
    }
});

export default evogb;
