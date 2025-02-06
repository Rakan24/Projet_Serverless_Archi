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
        
        // Une fois l'upload terminé, récupérer les fichiers JSON depuis Azure
        if (data.status === 'success') {
            fetchJsonFiles(); // Charge la liste des fichiers JSON
        }
    })
    .catch(error => {
        console.error('Erreur lors de la requête:', error);
        message.textContent = "Une erreur est survenue. Veuillez réessayer.";
        message.style.color = 'red';
        message.classList.remove('hidden');
    });
});



// Fonction pour récupérer et afficher la liste des fichiers JSON
// Fonction pour récupérer et afficher la liste des fichiers JSON
function fetchJsonFiles() {
    fetch('http://127.0.0.1:5000/list-json-files')
        .then(response => response.json())
        .then(data => {
            console.log('Réponse de l\'API:', data);  // Afficher la réponse brute pour le débogage

            // Vérifier si les données sont valides et contiennent le champ 'files'
            if (data.status === 'success' && Array.isArray(data.files)) {
                displayJsonFiles(data.files);
            } else {
                console.error("Erreur: La réponse ne contient pas de fichiers JSON valides.");
                console.log('Réponse de l\'API:', data);  // Affichage détaillé de la réponse
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des fichiers JSON:', error);
        });
}

// Fonction pour afficher la liste des fichiers JSON dans un tableau
function displayJsonFiles(files) {
    const table = document.getElementById('jsonFileList');
    table.innerHTML = ''; // Effacer le tableau précédent

    // Vérifier si le tableau 'files' n'est pas vide
    if (files && files.length > 0) {
        files.forEach(file => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="javascript:void(0);" onclick="fetchJsonData('${file}')">${file}</a></td>
            `;
            table.appendChild(row);
        });
    } else {
        table.innerHTML = '<tr><td colspan="2">Aucun fichier JSON trouvé.</td></tr>';
    }
}

// Fonction pour récupérer et afficher les données JSON d'un fichier
function fetchJsonData(filename) {
    fetch(`http://127.0.0.1:5000/get-json-file/${filename}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Réponse JSON brute reçue : ", data);  // Afficher toute la réponse brute pour débogage

            if (data.status === 'success' && data.data) {
                // Vérification de la structure des données reçues
                console.log("Données à afficher :", data.data);  // Afficher les données spécifiques pour vérification

                // Vérification de la structure attendue
                if (data.data && data.data.original_blob && data.data.analysis) {
                    displayJsonContent(data.data); // Passe les données à la fonction d'affichage
                } else {
                    console.error("Erreur : Données JSON mal formatées.", data);
                    alert("Les données JSON sont mal formatées.");
                }
            } else {
                console.error("Erreur ou aucune donnée :", data.message || "Données manquantes");
                alert("Erreur dans les données reçues.");
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données JSON:', error);
            alert("Une erreur est survenue lors du chargement des données JSON.");
        });
}





// Fonction pour afficher le contenu JSON dans un conteneur avec mise en forme

function displayJsonContent(jsonData) {
    // Récupération de l'élément div où le contenu sera inséré
    const jsonContentDiv = document.getElementById("jsonContent");

    // Initialisation du contenu HTML
    let htmlContent = '';

    // Vérification de la présence de original_blob
    if (jsonData.original_blob) {
        htmlContent += `<div class="json-section">
                            <h3>Original Blob</h3>
                            <p>${jsonData.original_blob}</p>
                        </div>`;
    } else {
        htmlContent += `<div class="json-section">
                            <h3>Original Blob</h3>
                            <p>Aucune donnée disponible pour ce champ.</p>
                        </div>`;
    }

    // Vérification de la présence de statistiques
    if (jsonData.analysis && jsonData.analysis.stats) {
        const stats = jsonData.analysis.stats;
        htmlContent += `<div class="json-section">
                            <h3>Statistiques</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Catégorie</th>
                                        <th>Moyenne</th>
                                        <th>Médiane</th>
                                        <th>Écart-Type</th>
                                    </tr>
                                </thead>
                                <tbody>`;

        for (let category in stats) {
            htmlContent += `<tr>
                                <td>${category}</td>
                                <td>${stats[category].moyenne}</td>
                                <td>${stats[category].mediane}</td>
                                <td>${stats[category].ecart_type}</td>
                            </tr>`;
        }

        htmlContent += `    </tbody>
                            </table>
                         </div>`;
    } else {
        htmlContent += `<div class="json-section">
                            <h3>Statistiques</h3>
                            <p>Aucune statistique disponible.</p>
                         </div>`;
    }

    // Vérification de la présence d'anomalies
    if (jsonData.analysis && jsonData.analysis.anomalies && jsonData.analysis.anomalies.length > 0) {
        const anomalies = jsonData.analysis.anomalies;
        htmlContent += `<div class="json-section">
                            <h3>Anomalies</h3>
                            <ul>`;
        anomalies.forEach(anomaly => {
            htmlContent += `<li>${anomaly}</li>`;
        });
        htmlContent += `</ul></div>`;
    } else {
        htmlContent += `<div class="json-section">
                            <h3>Anomalies</h3>
                            <p>Aucune anomalie détectée.</p>
                        </div>`;
    }

    // Insertion du contenu formaté dans la div
    jsonContentDiv.innerHTML = htmlContent;
}













// Fonction utilitaire pour formater les valeurs JSON (récursive si nécessaire)
function formatJsonValue(value) {
    if (typeof value === 'object' && !Array.isArray(value)) {
        let subHtml = '<ul>';
        for (const [key, subValue] of Object.entries(value)) {
            subHtml += `<li><strong>${key}:</strong> ${formatJsonValue(subValue)}</li>`;
        }
        subHtml += '</ul>';
        return subHtml;
    } else if (Array.isArray(value)) {
        return `<ul>${value.map(item => `<li>${item}</li>`).join('')}</ul>`;
    } else {
        return `<span>${value}</span>`;
    }
}
