import logging
import azure.functions as func
import json
import os
import io
import csv
import statistics
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp()

def process_csv(csv_content: str):
    anomalies = []
    prix_list = []
    qte_list = []
    note_list = []

    # Utilise StringIO pour traiter le CSV en mémoire
    csv_file = io.StringIO(csv_content)
    lecteur = csv.DictReader(csv_file, delimiter=',')
    
    for row in lecteur:
        # Récupération de l'ID (si présent)
        id_ligne = row.get("ID", None)
        if not id_ligne:
            continue
        try:
            prix = float(row["Prix"])
            quantite = float(row["Quantité"])
            note = float(row["Note_Client"])
        except (ValueError, KeyError):
            anomalies.append({
                'ID': id_ligne,
                'Erreur': "Impossible de parser la ligne ou colonne manquante"
            })
            continue

        # Vérification des plages de valeurs
        if prix < 0 or prix > 500:
            anomalies.append({
                'ID': id_ligne,
                'Erreur': "Prix hors intervalle [0, 500]"
            })
        if quantite <= 0 or quantite > 1000:
            anomalies.append({
                'ID': id_ligne,
                'Erreur': "Quantité hors intervalle (1, 1000)"
            })
        if note < 1.0 or note > 5.0:
            anomalies.append({
                'ID': id_ligne,
                'Erreur': "Note client hors intervalle [1.0, 5.0]"
            })

        prix_list.append(prix)
        qte_list.append(quantite)
        note_list.append(note)

    # Fonctions utilitaires pour le calcul en toute sécurité
    def safe_mean(lst):
        return round(statistics.mean(lst), 2) if lst else None

    def safe_median(lst):
        return round(statistics.median(lst), 2) if lst else None

    def safe_stdev(lst):
        return round(statistics.stdev(lst), 2) if len(lst) > 1 else None

    stats = {
        'Prix': {
            'moyenne': safe_mean(prix_list),
            'mediane': safe_median(prix_list),
            'ecart_type': safe_stdev(prix_list)
        },
        'Quantité': {
            'moyenne': safe_mean(qte_list),
            'mediane': safe_median(qte_list),
            'ecart_type': safe_stdev(qte_list)
        },
        'Note_Client': {
            'moyenne': safe_mean(note_list),
            'mediane': safe_median(note_list),
            'ecart_type': safe_stdev(note_list)
        }
    }

    return stats, anomalies

@app.blob_trigger(
    arg_name="myblob",
    path="csv/{name}.csv",
    connection="AzureWebJobsStorage"
)
def main(myblob: func.InputStream):
    logging.info(f"Nouveau fichier détecté : {myblob.name} (Taille: {myblob.length} bytes)")

    try:
        # Lecture du contenu du CSV
        csv_content = myblob.read().decode("latin-1")
        
        # Appel de la fonction d'analyse pour obtenir statistiques et anomalies
        stats, anomalies = process_csv(csv_content)
        
        # Construction du contenu JSON à écrire
        result = {
            "original_blob": myblob.name[4:],
            "analysis": {
                "stats": stats,
                "anomalies": anomalies
            }
        }
        content_str = json.dumps(result, indent=4)


        # Déduction du nom du fichier JSON : remplace .csv par .json
        if myblob.name.lower().endswith(".csv"):
            json_blob_name = myblob.name[4:-4] + ".json"
        else:
            json_blob_name = myblob.name[4:] + ".json"
        
        # Récupération de la chaîne de connexion
        connection_string = os.getenv("AzureWebJobsStorage", "DefaultEndpointsProtocol=https;AccountName=finaltestserverless;AccountKey=jb75bGFQoQ0fUVZWbWAUiYN055uZ+HUY/ZpJEJ+8MthzF98M9DrKCQiqqMslXWea9U1oFZLMK9Qe+ASt+7SkgA==;EndpointSuffix=core.windows.net")
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        container_name = "csv"
        
        # Récupération du client du conteneur et du blob de sortie
        container_client = blob_service_client.get_container_client(container_name)
        blob_client = container_client.get_blob_client(json_blob_name)
        
        # Upload du fichier JSON (overwrite=True)
        blob_client.upload_blob(content_str, overwrite=True)
        
        logging.info(f"Fichier JSON '{json_blob_name}' créé avec succès dans le conteneur '{container_name}'.")
    
    except Exception as e:
        logging.error(f"Erreur lors de la création du fichier JSON : {str(e)}")

if __name__ == "__main__":
    app.run()
