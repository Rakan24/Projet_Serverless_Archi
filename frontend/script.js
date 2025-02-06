







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
        
        // Une fois l'upload terminé, attendre 10 secondes avant de récupérer les fichiers JSON
        if (data.status === 'success') {
            setTimeout(() => {
                fetchJsonFiles();  // Charge la liste des fichiers JSON après 10 secondes
            }, 10000);  // 10 secondes en millisecondes
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
function fetchJsonFiles() {
    console.log("OKOKOKOKOKOK fetchhhhhhhhhhhh");
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

// Attente que la page soit complètement chargée avant d'appeler fetchJsonFiles()
document.addEventListener('DOMContentLoaded', function() {
    console.log("OKOKOKOKOKOK");
    fetchJsonFiles(); // Charger la liste des fichiers JSON dès que la page est prête
});


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
    const filePath = filename;  // filename devrait déjà être du genre 'csv/csv/data_normal.json'

    fetch(`http://127.0.0.1:5000/get-json-file/${filePath}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Réponse JSON brute reçue : ", data);  // Afficher toute la réponse brute pour le débogage

            // Vérifier si le JSON contient les bonnes clés
            if (data && data.status === 'success') {
                const jsonData = data;  // Pas besoin de data.data, les données sont directement sous 'data'

                // Ajout d'un log pour vérifier la structure complète des données JSON
                console.log("Structure complète des données JSON : ", jsonData);

                // Vérification de la structure attendue pour "analysis" et "stats"
                if (jsonData && jsonData.analysis) {
                    console.log("Clé 'analysis' trouvée : ", jsonData.analysis);

                    if (jsonData.analysis.stats) {
                        console.log("Clé 'stats' trouvée dans 'analysis' : ", jsonData.analysis.stats);

                        // Vérification de la structure des anomalies
                        if (jsonData.analysis.anomalies !== undefined) {
                            console.log("Clé 'anomalies' trouvée dans 'analysis' : ", jsonData.analysis.anomalies);

                            // Si la structure est correcte, afficher les données
                            displayJsonContent(jsonData);
                        } else {
                            console.error("Erreur : La clé 'anomalies' est manquante ou incorrecte.");
                            alert("Les données JSON sont mal formatées, la clé 'anomalies' est manquante ou incorrecte.");
                        }
                    } else {
                        console.error("Erreur : La clé 'stats' est manquante dans 'analysis'.");
                        alert("Les données JSON sont mal formatées, la clé 'stats' est manquante dans 'analysis'.");
                    }
                } else {
                    console.error("Erreur : La clé 'analysis' est manquante dans les données JSON.");
                    alert("Les données JSON sont mal formatées, la clé 'analysis' est manquante.");
                }
            } else {
                console.error("Erreur : Données JSON mal formatées ou statut échoué.", data);
                alert("Les données JSON sont mal formatées ou le statut est incorrect.");
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données JSON:', error);
            alert("Une erreur est survenue lors du chargement des données JSON.");
        });
}

// Fonction pour afficher le contenu JSON dans un conteneur avec mise en forme
function displayJsonContent(jsonData) {
    const jsonContentDiv = document.getElementById("jsonContent");

    // Formatage des statistiques
    const analysis = jsonData.analysis;  // Accès à "analysis"
    if (analysis && analysis.stats) {
        const stats = analysis.stats;  // Accès sécurisé à "analysis.stats"
        let htmlContent = `<div class="json-section">
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

        // Vérification des données dans "stats"
        if (stats) {
            for (let category in stats) {
                htmlContent += `<tr>
                                    <td>${category}</td>
                                    <td>${stats[category].moyenne}</td>
                                    <td>${stats[category].mediane}</td>
                                    <td>${stats[category].ecart_type}</td>
                                </tr>`;
            }
        } else {
            htmlContent += `<tr><td colspan="4">Aucune statistique disponible.</td></tr>`;
        }

        htmlContent += `    </tbody>
                            </table>
                         </div>`;

        // Formatage des anomalies
        const anomalies = analysis.anomalies;  // Accès à "analysis.anomalies"
        htmlContent += `<div class="json-section">
                            <h3>Anomalies</h3>`;

        if (anomalies && anomalies.length > 0) {
            htmlContent += `<ul>`;
            anomalies.forEach(anomaly => {
                // Vérification si l'anomalie est un objet avec des propriétés "ID" et "Erreur"
                if (anomaly && typeof anomaly === 'object' && anomaly.ID && anomaly.Erreur) {
                    htmlContent += `<li>ID: ${anomaly.ID} - Erreur: ${anomaly.Erreur}</li>`;
                } else if (typeof anomaly === 'string') {
                    // Si l'anomalie est une simple chaîne (dans le cas d'une erreur de format)
                    htmlContent += `<li>Anomalie: ${anomaly}</li>`;
                } else {
                    console.error('Format d\'anomalie inattendu :', anomaly);
                    htmlContent += `<li>Erreur dans le format de l'anomalie.</li>`;
                }
            });
            htmlContent += `</ul>`;
        } else {
            htmlContent += `<p>Aucune anomalie détectée.</p>`;
        }

        htmlContent += `</div>`;


        // Insertion du contenu formaté dans la div
        jsonContentDiv.innerHTML = htmlContent;
    } else {
        console.error("La clé 'analysis' ou 'stats' est manquante dans les données JSON.");
        alert("Les données JSON sont mal formatées, la clé 'analysis' ou 'stats' est manquante.");
    }
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
