function getWeatherIcon(code) {
    const icons = {
        0: "☀️", 1: "🌤️", 2: "🌥️", 3: "☁️",
        45: "🌫️", 48: "🌫️", 51: "🌧️", 53: "🌧️", 55: "🌧️",
        61: "🌧️", 63: "⛈️", 65: "⛈️", 71: "❄️", 73: "❄️", 
        75: "❄️", 77: "❄️", 80: "🌧️", 81: "⛈️", 82: "⛈️",
        86: "❄️", 95: "⛈️", 96: "⛈️", 99: "⛈️"
    };
    return icons[code] || "❓";
}

function getWeatherDescription(code) {
    const description = {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 61: 'Slight Rain',
        63: 'Moderate Rain', 65: 'Heavy Rain', 95: 'Thunderstorm'
    };
    return description[code] || 'Cloudy';
}

// Fixed the typo from "serachWeather" to "searchWeather" to match your HTML call
async function searchWeather() {
    const cityInput = document.getElementById('cityInput'); // Make sure your input has this ID
    const city = cityInput ? cityInput.value : "";
    const errorDiv = document.getElementById('err-msg');
    const loadingDiv = document.getElementById('loading');
    const contentDiv = document.getElementById('weathercontent');

    if (!city) return;

    errorDiv.style.display = 'none';
    contentDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    try {
        const location = await getCoordinates(city);
        const weather = await getWeather(location.latitude, location.longitude);
        
        // Ensure data exists before updating
        if (weather && weather.current) {
            updateCurrentWeather(location, weather);
            updateDailyForecast(weather);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
        } else {
            throw new Error("Invalid weather data received");
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        console.error(error);
    }
}

async function getCoordinates(city) {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const data = await response.json();
    if (!data.results || data.results.length === 0) throw new Error('City not found');
    return data.results[0]; // Returns object with .name, .country, .latitude, .longitude
}

async function getWeather(lat, lon) {
    // Corrected the parameters to ensure all required fields are returned
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const response = await fetch(url);
    return await response.json();
}

function updateCurrentWeather(location, weather) {
    const current = weather.current;
    
    document.getElementById('location').textContent = `${location.name}, ${location.country}`;
    document.getElementById('date').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    document.getElementById("currentIcon").textContent = getWeatherIcon(current.weather_code);
    document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('description').textContent = getWeatherDescription(current.weather_code);
    document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windspeed').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure)} hPa`;
}

function updateDailyForecast(weather) {
    const daily = weather.daily;
    const container = document.getElementById('dailyForecast');
    if (!container) return;
    
    container.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const div = document.createElement('div');
        div.className = 'daily-item';
        div.innerHTML = `
            <div class="day">${i === 0 ? 'Today' : dayName}</div>
            <div class="icon">${getWeatherIcon(daily.weather_code[i])}</div>
            <div class="temps">
                <strong>${Math.round(daily.temperature_2m_max[i])}°</strong> 
                <small>${Math.round(daily.temperature_2m_min[i])}°</small>
            </div>
        `;
        container.appendChild(div);
    }
}