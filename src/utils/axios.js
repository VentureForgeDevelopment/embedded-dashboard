// src/utils/axios.js
import axios from 'axios';
import { getCSRFToken } from './auth';
import { config } from '../config/environment';

const instance = axios.create({
  baseURL: config.apiUrl.replace('/vff-sso/', ''),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

instance.interceptors.request.use(config => {
  const token = getCSRFToken();
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

export default instance;
