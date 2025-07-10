import axios from "axios";

const api = axios.create({
	baseURL: window.env.BACKEND_URL,
	withCredentials: true,
});

export const openApi = axios.create({
	baseURL: window.env.BACKEND_URL
	
});

export default api;
