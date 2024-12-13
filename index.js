const express = require('express');
const app = express();
const helmet = require('helmet');
const bodyParser = require('express').json();

// Add weather API configuration
const axios = require('axios');
const WEATHER_API_KEY = 'd41369bba16a0801fba4120c57b8508c';  // Your API key
const DEFAULT_CITY = 'Rajpura';

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(helmet());
app.use(bodyParser);

// Utility function to get weather
async function getWeatherData(city = DEFAULT_CITY) {
    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`
        );
        
        if (response.data.cod === 401) {
            console.error('Weather API Error: Invalid API key');
            throw new Error('Invalid API key');
        }
        
        return {
            temperature: Math.round(response.data.main.temp),
            description: response.data.weather[0].description,
            humidity: response.data.main.humidity,
            windSpeed: response.data.wind.speed,
            city: response.data.name,
            country: response.data.sys.country
        };
    } catch (error) {
        console.error('Weather API Error:', error.message);
        // Return mock data with error indication
        return {
            temperature: '--',
            description: 'API Error: ' + (error.message || 'Failed to fetch weather'),
            humidity: '--',
            windSpeed: '--',
            city: city,
            country: '--',
            error: true
        };
    }
}

// Root route with dashboard
app.get('/', async (req, res) => {
    try {
        const userName = req.query.name || "Guest";
        const userCity = req.query.city || DEFAULT_CITY;
        const currentHour = new Date().getHours();
        let greeting;

        if (currentHour < 12) {
            greeting = "Good morning";
        } else if (currentHour < 18) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }

        const weather = await getWeatherData(userCity);
        
        // System stats (these will work regardless of weather API)
        const stats = {
            uptime: Math.floor(process.uptime()),
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            cpu: process.cpuUsage(),
            lastUpdated: new Date().toLocaleTimeString()
        };

        if (weather.error) {
            console.log('Weather API is not working. Please check your API key.');
        }

        res.render('index', {
            name: userName,
            greeting: greeting,
            weather: weather,
            stats: stats,
            currentCity: userCity,
            weatherError: weather.error
        });
    } catch (error) {
        console.error('Route Error:', error);
        res.status(500).send('Something went wrong!');
    }
});

// API endpoints for dashboard data
app.get('/api/stats', (req, res) => {
    const stats = {
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        time: new Date().toLocaleTimeString()
    };
    res.json(stats);
});

// Quick action endpoints
app.post('/api/actions/profile', (req, res) => {
    res.json({ message: 'Profile action triggered' });
});

app.post('/api/actions/settings', (req, res) => {
    res.json({ message: 'Settings action triggered' });
});

app.post('/api/actions/home', (req, res) => {
    res.json({ message: 'Home action triggered' });
});

// Add this new endpoint to change city
app.post('/api/weather/city', async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            return res.status(400).json({ error: 'City is required' });
        }
        const weatherData = await getWeatherData(city);
        res.json(weatherData);
    } catch (error) {
        console.error('Weather City Error:', error);
        res.status(500).json({ error: 'Failed to get weather data' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
