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
  })
  .catch(error => {
      console.error('Erreur lors de la requête:', error);
      message.textContent = "Une erreur est survenue. Veuillez réessayer.";
      message.style.color = 'red';
      message.classList.remove('hidden');
  });
});





function displayAnalysisResults(analysis) {
  let resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '';

  if (analysis.stats) {
      resultDiv.innerHTML += `<h3>Statistiques :</h3>`;
      resultDiv.innerHTML += `
          <ul>
              <li>Moyenne prix : ${analysis.stats.moyenne_prix}</li>
              <li>Médiane prix : ${analysis.stats.mediane_prix}</li>
              <li>Écart type prix : ${analysis.stats.ecart_type_prix}</li>
              <li>Moyenne quantité : ${analysis.stats.moyenne_quantite}</li>
              <li>Médiane quantité : ${analysis.stats.mediane_quantite}</li>
              <li>Écart type quantité : ${analysis.stats.ecart_type_quantite}</li>
              <li>Moyenne note : ${analysis.stats.moyenne_note}</li>
              <li>Médiane note : ${analysis.stats.mediane_note}</li>
              <li>Écart type note : ${analysis.stats.ecart_type_note}</li>
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