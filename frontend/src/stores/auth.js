import { defineStore } from 'pinia';
import axios from 'axios'; 


const API_URL = 'http://localhost:3000/api/auth'; 

export const useAuthStore = defineStore('auth', {
    
    state: () => ({
        token: localStorage.getItem('userToken') || null, 
        isAuthenticated: !!localStorage.getItem('userToken'), 
    }),

    getters: {
        isLoggedIn: (state) => state.isAuthenticated, 
    },

    
    actions: {
        
        
        init() {
            const token = localStorage.getItem('userToken');
            if (token) {
                this.token = token;
                this.isAuthenticated = true;
                
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
        },
        
        
        handleSuccessfulAuth(token) {
            this.token = token;
            this.isAuthenticated = true;
            localStorage.setItem('userToken', token); 
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
        },

  
        async register(email, password) {
            try {
                const response = await axios.post(`${API_URL}/register`, {
                    email: email,
                    password: password
                });

                
                this.handleSuccessfulAuth(response.data.token);
                return true; 
            } catch (error) {
               
                throw error.response.data.message || 'Registrierung fehlgeschlagen.';
            }
        },

 
        async login(email, password) {
            try {
                const response = await axios.post(`${API_URL}/login`, {
                    email: email,
                    password: password
                });

                this.handleSuccessfulAuth(response.data.token);
                return true;
            } catch (error) {
                throw error.response.data.message || 'Login fehlgeschlagen.';
            }
        },
        
     
        logout() {
            this.token = null;
            this.isAuthenticated = false;
            localStorage.removeItem('userToken'); 
            delete axios.defaults.headers.common['Authorization']; 
        },
    }
});