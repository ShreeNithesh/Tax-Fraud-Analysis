document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        home: document.getElementById('add-taxpayer'),
        taxpayers: document.getElementById('taxpayer-list'),
        highRisk: document.getElementById('high-risk'),
        trends: document.getElementById('fraud-trends'),
        search: document.getElementById('search-section'),
        locality: document.getElementById('locality-section')
    };

    const toggleSection = (showSection) => {
        Object.values(sections).forEach(section => section.classList.add('hidden'));
        sections[showSection].classList.remove('hidden');
    };

    document.getElementById('home-btn').addEventListener('click', () => toggleSection('home'));
    document.getElementById('search-btn').addEventListener('click', () => toggleSection('search'));
    document.getElementById('locality-btn').addEventListener('click', () => toggleSection('locality'));

    // Add Taxpayer
    document.getElementById('taxpayer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('email').value,
            phone_no: document.getElementById('phone_no').value,
            address: document.getElementById('address').value || null,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            country: document.getElementById('country').value,
            dob: document.getElementById('dob').value,
            occupation: document.getElementById('occupation').value || null,
            marital_stat: document.getElementById('marital_stat').value,
            employment_stat: document.getElementById('employment_stat').value,
            ssn: document.getElementById('ssn').value
        };

        try {
            const response = await fetch('http://localhost:3000/taxpayers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const message = document.getElementById('form-message');
            if (response.ok) {
                message.textContent = 'Taxpayer added successfully!';
                message.style.background = '#d4edda';
                document.getElementById('taxpayer-form').reset();
            } else {
                message.textContent = 'Error adding taxpayer.';
                message.style.background = '#f8d7da';
            }
        } catch (error) {
            document.getElementById('form-message').textContent = 'Network error: ' + error.message;
            document.getElementById('form-message').style.background = '#f8d7da';
        }
    });

    // Fetch Taxpayers
    document.getElementById('fetch-taxpayers').addEventListener('click', async () => {
        toggleSection('taxpayers');
        try {
            const response = await fetch('http://localhost:3000/taxpayers');
            const taxpayers = await response.json();
            const tbody = document.querySelector('#taxpayer-table tbody');
            tbody.innerHTML = '';
            taxpayers.forEach(taxpayer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${taxpayer.taxpayer_id}</td>
                    <td>${taxpayer.first_name}</td>
                    <td>${taxpayer.last_name}</td>
                    <td>${taxpayer.email}</td>
                    <td>${taxpayer.ssn}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching taxpayers:', error);
        }
    });

    // Fetch High-Risk Taxpayers
    document.getElementById('fetch-high-risk').addEventListener('click', async () => {
        toggleSection('highRisk');
        try {
            const response = await fetch('http://localhost:3000/high-risk-taxpayers');
            const highRiskTaxpayers = await response.json();
            const tbody = document.querySelector('#high-risk-table tbody');
            tbody.innerHTML = '';
            highRiskTaxpayers.forEach(taxpayer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${taxpayer.taxpayer_id}</td>
                    <td>${taxpayer.first_name}</td>
                    <td>${taxpayer.last_name}</td>
                    <td>${taxpayer.fraud_count}</td>
                    <td>$${taxpayer.total_amount.toFixed(2)}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching high-risk taxpayers:', error);
        }
    });

    // Fetch Fraud Trends
    document.getElementById('fetch-trends').addEventListener('click', async () => {
        toggleSection('trends');
        try {
            const response = await fetch('http://localhost:3000/fraud-trends');
            const trends = await response.json();
            const tbody = document.querySelector('#trends-table tbody');
            tbody.innerHTML = '';
            trends.forEach(trend => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${trend.method_name}</td>
                    <td>${trend.fraud_count}</td>
                    <td>${trend.month}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching fraud trends:', error);
        }
    });

    // Search Taxpayer
    document.getElementById('search-submit').addEventListener('click', async () => {
        const name = document.getElementById('search-name').value.trim();
        if (!name) return;
        
        try {
            const response = await fetch(`http://localhost:3000/search-taxpayer?name=${encodeURIComponent(name)}`);
            const taxpayers = await response.json();
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = '';

            if (taxpayers.length === 0) {
                resultsDiv.textContent = 'No taxpayers found.';
            } else if (taxpayers.length > 1) {
                resultsDiv.innerHTML = '<p>Multiple taxpayers found with this name. Please provide phone number:</p>';
                const phoneInput = document.createElement('input');
                phoneInput.type = 'text';
                phoneInput.placeholder = 'Enter Phone Number';
                const phoneSubmit = document.createElement('button');
                phoneSubmit.textContent = 'Search by Phone';
                phoneSubmit.className = 'btn';
                phoneSubmit.addEventListener('click', async () => {
                    const phone = phoneInput.value;
                    const phoneResponse = await fetch(`http://localhost:3000/search-taxpayer?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`);
                    const result = await phoneResponse.json();
                    displayTaxpayerResults(result, resultsDiv);
                });
                resultsDiv.appendChild(phoneInput);
                resultsDiv.appendChild(phoneSubmit);
            } else {
                displayTaxpayerResults(taxpayers, resultsDiv);
            }
        } catch (error) {
            console.error('Error searching taxpayer:', error);
        }
    });

    function displayTaxpayerResults(taxpayers, container) {
        container.innerHTML = '';
        taxpayers.forEach(t => {
            const div = document.createElement('div');
            div.innerHTML = `
                <p>ID: ${t.taxpayer_id}</p>
                <p>Name: ${t.first_name} ${t.last_name}</p>
                <p>Email: ${t.email}</p>
                <p>Phone: ${t.phone_no}</p>
                <p>SSN: ${t.ssn}</p>
                <p>City: ${t.city}</p>
            `;
            container.appendChild(div);
        });
    }

    // Locality Analysis
    let localityChart;
    document.getElementById('locality-submit').addEventListener('click', async () => {
        const city = document.getElementById('locality-input').value.trim();
        if (!city) return;

        try {
            const response = await fetch(`http://localhost:3000/locality-analysis?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            const ctx = document.getElementById('locality-chart').getContext('2d');

            if (localityChart) localityChart.destroy();
            localityChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Fraudulent', 'Non-Fraudulent'],
                    datasets: [{
                        data: [data.fraud_count, data.total_taxpayers - data.fraud_count],
                        backgroundColor: ['#ff4444', '#44ff44']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: `Fraud Analysis for ${city}` }
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching locality analysis:', error);
        }
    });
});