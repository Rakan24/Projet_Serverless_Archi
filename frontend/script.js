document.getElementById('uploadForm').addEventListener('submit', function(event) {
    const form = event.target;
    const message = document.getElementById('message');
    const fileInput = document.getElementById('file');
    
    // Empêche le comportement par défaut du formulaire
    event.preventDefault();
    
    // Vérifie si un fichier est sélectionné
    if (fileInput.files.length === 0) {
        message.textContent = "Veuillez sélectionner un fichier.";
        message.style.color = 'red';
        message.classList.remove('hidden');
        return;
    }
    
    // Crée une instance de FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
  
    // Affiche des informations sur le fichier avant l'envoi pour déboguer
    console.log("Fichier à envoyer :", fileInput.files[0].name);
    console.log("Type du fichier :", fileInput.files[0].type);
    console.log("Taille du fichier :", fileInput.files[0].size, "bytes");
  
    // Envoie le fichier au backend via Fetch API
    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Données retournées:', data);
        message.textContent = data.message;
        message.style.color = data.status === 'success' ? 'green' : 'red';
        message.classList.remove('hidden');
        
        // Une fois l'upload terminé, récupérer les résultats JSON
        if (data.status === 'success') {
            fetch('http://127.0.0.1:5000/get-result')
                .then(response => response.json())
                .then(jsonData => {
                    console.log('Données JSON retournées:', jsonData);
                    displayAnalysisResults(jsonData.data);
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération du résultat JSON:', error);
                    message.textContent = "Erreur lors de la récupération des résultats. Veuillez réessayer.";
                    message.style.color = 'red';
                    message.classList.remove('hidden');
                });
        }
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
        message.textContent = "Une erreur est survenue. Veuillez réessayer.";
        message.style.color = 'red';
        message.classList.remove('hidden');
    });
  });
  
  
  function displayAnalysisResults(jsonData) {
    const analysis = JSON.parse(jsonData); // Analyse les données JSON
    let resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';
  
    if (analysis.statistics) {
        resultDiv.innerHTML += `<h3>Statistiques :</h3>`;
        resultDiv.innerHTML += `
            <ul>
                <li>Moyenne prix : ${analysis.statistics.Prix.moyenne}</li>
                <li>Médiane prix : ${analysis.statistics.Prix.mediane}</li>
                <li>Écart type prix : ${analysis.statistics.Prix.ecart_type}</li>
                <li>Moyenne quantité : ${analysis.statistics.Quantité.moyenne}</li>
                <li>Médiane quantité : ${analysis.statistics.Quantité.mediane}</li>
                <li>Écart type quantité : ${analysis.statistics.Quantité.ecart_type}</li>
                <li>Moyenne note : ${analysis.statistics.Note_Client.moyenne}</li>
                <li>Médiane note : ${analysis.statistics.Note_Client.mediane}</li>
                <li>Écart type note : ${analysis.statistics.Note_Client.ecart_type}</li>
            </ul>
        `;
    }
  
    if (analysis.anomalies && analysis.anomalies.length > 0) {
        resultDiv.innerHTML += `<h3>Anomalies détectées :</h3>`;
        resultDiv.innerHTML += `<ul>`;
        analysis.anomalies.forEach((anomaly, index) => {
            resultDiv.innerHTML += `<li>Anomalie #${index + 1} à la ligne ${anomaly}</li>`;
        });
        resultDiv.innerHTML += `</ul>`;
    } else {
        resultDiv.innerHTML += `<p>Aucune anomalie détectée.</p>`;
    }
  }
  